const express = require('express');
require('dotenv').config();
const cron = require('node-cron');
const { firebase } = require('./src/firebase.js');


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
            else if (requestJson.view.callback_id == "reccurence_setting_view") {
                modal.updateReminderView(requestJson)
            }
            else if (requestJson.view.callback_id == "reminder_view") {
                functions.registerReminder(requestJson)
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
        else if (requestJson.actions[0].action_id == "is_notify_at_channel" || requestJson.actions[0].action_id == "is_anonymous" || requestJson.actions[0].action_id == "is_notify_to_user" || requestJson.actions[0].action_id == 'is_multiple_selection' || requestJson.actions[0].action_id == 'is_post_in_thread') {
            modal.updateButtons(requestJson)
        }
        else if (requestJson.actions[0].value == "open_reccurence_settings") {
            modal.pushReccurenceSetting(requestJson)
        }
        else if (requestJson.actions[0].action_id == 'static_select_reminder_patterns') {
            modal.updateReccurenceSetting(requestJson)
        }
    }
    else if (requestJson.type == "block_actions") {
        if(requestJson.actions[0].action_id.includes("option_")) {
            //baymax poll
            functions.registerAnswer(requestJson)
        }
        else{
            // 出欠アンケート
            functions.attendanceCheckMain(requestJson)
        }
        
    }
    
    response.send(''); 

});

app.post('/api/v1/openModal', (request, response) => {
    console.log('slacks command: ', request.body)
    const triggerId = request.body.trigger_id
    modal.openModal(triggerId)
    response.send(''); 
})

app.get('/api/v1/postCloudMeeting', (request, response) => {
    functions.postCloudMeeting()
    response.send('');
});

app.get('/api/v1/postAttendanceCheckPoll', (request, response) => {
    functions.postAttendanceCheckPoll()
    response.send(''); 
});
app.get('/api/v1/postAttendanceCheckRemind', (request, response) => {
    functions.postAttendanceCheckRemind()
    response.send(''); 
});

app.post('/api/v1/reminder', async (request, response) => {
    // const triggerId = request.body.trigger_id
    // modal.openReminder(triggerId)
    // response.send(''); 
    console.log('/api/v1/reminder')
    const user_id = request.body.user_id
    console.log('user_id: ', user_id)
    const reminders = await functions.getReminders(user_id)
    console.log('reminders: ', reminders)
    functions.postReminderList(reminders, user_id)
    response.send(''); 
})



// Cron Jobs
// 1. 出欠アンケート投稿
cron.schedule('0 10 * * *', () => {
    const schedule = ['月','火','水','木','金']
    const dayOfWeek = functions.getToday()[2]    
    if(schedule.includes(dayOfWeek)){
      functions.postAttendanceCheckPoll()
    }
});
// 2. 出欠アンケートリマインド
cron.schedule('0 13 * * *', () => {
    const schedule = ['月','火','水','木','金']
    const dayOfWeek = functions.getToday()[2]    
    if(schedule.includes(dayOfWeek)){
        functions.postAttendanceCheckRemind()
    }
});
// 3. デジ共朝会
cron.schedule('15 9 * * *', () => {
    const schedule = ['月','火','水','木','金']
    const dayOfWeek = functions.getToday()[2]    
    if(schedule.includes(dayOfWeek)){
        functions.postCloudMeeting()
    }
});

// 4. Firebase Realtime Database データ削除
cron.schedule('0 9 * * *', () => {
    console.log('excuted')
    functions.deleteOldDatafromFirebase()
});


// async function debug (){
//     const user_id = 'U027Z4X5ZMM'
//     const reminders = await functions.getReminders(user_id)
//     functions.postReminderList(reminders, user_id)
// }

// debug()
