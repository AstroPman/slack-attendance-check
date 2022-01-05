const express = require('express');
require('dotenv').config();
const cron = require('node-cron');

const firebaseDb =  require('./src/firebase.js');
const functions = require('./src/functions.js');
const modal = require('./src/modal.js')


// Express 
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Express Server Listen START at port=${port}`);
});


// API
app.get('/api/v1/', (request, response) => {
    response.send('Hello, World'); 
});

app.get('/api/v1/livenessProbe', (request, response) => {
    response.send("I'm awake!!");
});

app.post('/api/v1/endpoint', (request, response) => {
    // parse request body to json
    const requestJson = JSON.parse(request.body.payload)
    console.log("============================================")
    console.log("/api/v1/endpoint requestJson: ", requestJson)
    
    if ("view" in requestJson) {
        // recieve actions to modal
        if (requestJson.type == "view_submission") {
            if (requestJson.view.callback_id == "add_options_view")
                modal.updateModal(requestJson)
            else if (requestJson.view.callback_id == "poll_view") {
                modal.postPoll(requestJson)
            }
        }
        else if (requestJson.actions[0].value == "add_options") {
            modal.pushModal(requestJson)
        }
        else if (requestJson.actions[0].value == "add_input_form") {
            modal.addInputForm(requestJson)
        }
        else if (requestJson.actions[0].value == "remove_input_form") {
            modal.removeInputForm(requestJson)
        }
        else if (requestJson.actions[0].action_id == "is_notify_at_channel" || requestJson.actions[0].action_id == "is_anonymous") {
            modal.updateButtons(requestJson)
        }
    }
    else {
        //baymax poll
        // functions.registerAnswer(requestJson)
        
        // 出欠アンケート
        functions.attendanceCheckMain(requestJson)
        // const value = requestJson.actions[0].value
        // const respondent = "<@" + requestJson.user.name + ">"
        // const timestamp = requestJson.message.ts
            
        // const attendance = firebaseDb.ref('/').child('attendance/' + ( Number(timestamp) * 10 ** 6).toString())
        // attendance.once('value', snapshot => {
        //     const attendants = snapshot.val()
        //     if(attendants === null){
        //         attendance.update({
        //             [value]: [respondent]
        //         })
        //         const attendants = {
        //             [value]: [respondent]
        //         }
        //         functions.updateAttendanceCheckPoll(requestJson, attendants)
        //     }
        //     else if (typeof attendants[value] === "undefined") {
        //         attendance.update({
        //             [value]: [respondent]
        //         })
    
        //         for (const item in attendants) {         
        //             attendants[item] = attendants[item].filter( function (user) {
        //                 return user != respondent
        //             })
        //         }
        //         attendance.update(attendants)
        //         attendants[value] = [respondent]
        //         functions.updateAttendanceCheckPoll(requestJson, attendants)
        //     }
        //     else {
        //         for (const item in attendants) {
        //             // attendants[item] = attendants[item].split(',')
        //             if (item == value) {
        //                 if (!attendants[item].includes(respondent)) {
        //                     attendants[item].push(respondent)
        //                 }
        //                 else {
        //                     attendants[item] = attendants[item].filter( function (user) {
        //                         return user != respondent
        //                     })
        //                 }
        //             }
        //             else {
        //                 attendants[item] = attendants[item].filter( function (user) {
        //                     return user != respondent
        //                 })
        //             }
        //         } 
        //         attendance.update(attendants);
        //         functions.updateAttendanceCheckPoll(requestJson, attendants)
        //     }
        // })
    }
    
    response.send(''); 

});

app.post('/api/v1/openModal', (request, response) => {
    const triggerId = request.body.trigger_id
    modal.openModal(triggerId)
    response.send(''); 
})

app.get('/api/v1/postCloudMeeting', (request, response) => {
    response.send('');
    functions.postCloudMeeting()
});

app.get('/api/v1/postAttendanceCheckPoll', (request, response) => {
    response.send(''); 
    functions.postAttendanceCheckPoll()
});
app.get('/api/v1/postAttendanceCheckRemind', (request, response) => {
    response.send(''); 
    functions.postAttendanceCheckRemind()
});


// Cron Jobs
// 1. 出欠アンケート投稿
cron.schedule('0 10 * * *', () => {
    const dayOfWeek = functions.getToday()[2]
    if (dayOfWeek != "土" || dayOfWeek != "日" ) {
        //土日以外実行されない
        functions.postAttendanceCheckPoll()
    }
});
// 2. 出欠アンケートリマインド
cron.schedule('0 13 * * *', () => {
    const dayOfWeek = functions.getToday()[2]
    if (dayOfWeek != "土" || dayOfWeek != "日" ) {
        //土日以外実行されない
        functions.postAttendanceCheckRemind()
    }
});
// 3. デジ共朝会
cron.schedule('15 9 * * *', () => {
    const dayOfWeek = functions.getToday()[2]
    if (dayOfWeek != "土" || dayOfWeek != "日" ) {
        //土日以外実行されない
        functions.postCloudMeeting()
    }
});

// 4. Firebase Realtime Database データ削除
cron.schedule('0 0 * * *', () => {
    functions.deleteAttendanceDatafromFirebase()
});