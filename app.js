const express　=　require('express');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const firebaseDb =  require('./firebase.js');

// const attendance = firebaseDb.ref('/').child('attendance/' + "20211216")
// attendance.on('value', snapshot => {
//     console.log(snapshot.val())
// })
// attendance.update({
//     home: "xxx",
// })

// const respondent = "test1"
// const value = "osaki"

// attendance.on('value', snapshot => {
//     const attendants = snapshot.val()
//     console.log(attendants)
//     // if (!attendants){
//     //     db.ref('/').set({
//     //         attendance: {
//     //             [todayString]: {
//     //                 osaki: "",
//     //                 home: "",
//     //                 othres: ""
//     //             }
//     //         }
//     //     })
//     // }

//     for (const item in attendants) {
//         // attendants[item] = attendants[item].split(',')
//         if (item == value) {
//             if (!attendants[item].includes(respondent)) {
//                 attendants[item].push(respondent)
//             }
//             else {
//                 attendants[item] = attendants[item].filter( function (user) {
//                     return user != respondent
//                 })
//             }
//         }
//         else {
//             attendants[item] = attendants[item].filter( function (user) {
//                 return user != respondent
//             })
//         }
//     } 
//     attendance.set(attendants);
// })


// Slack Configureation
// const CHANNEL_ID = process.env.CHANNEL_ID_PROD; // kmp_kk_出社状況確認
const CHANNEL_ID = process.env.CHANNEL_ID_TEST; // baymax-sandbox
const API_KEY = process.env.API_KEY
const API_ENDPOINT = "https://slack.com/api"

// Express 
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Express Server Listen START at port=${port}`);
});

// Edit messages
const messages = JSON.parse(fs.readFileSync('./message_template.json', 'utf8'));
messages.channel = CHANNEL_ID
messages.blocks[0].text.text = "*" + getToday()[0] + "の出社状況*<!channel>"

function getToday () {
    // Date
    const date  = new Date();
    const year  = date.getFullYear();
    const month = date.getMonth() + 1;
    const day   = date.getDate();
    const today = (year + '年' + month + '月' + day + '日');
    const todayString = year.toString() + month.toString() + day.toString()
    return [today, todayString]
}

async function postAttendanceCheckPoll(){
    // Headers
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    // API CALL
    try { 
        const response = await axios.post(API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })
        console.log(response.data); 
    } catch (error) { 
        console.log(error.response.body); 
    } 
}

async function updateAttendanceCheckPoll(timestamp, attendants){
    messages.ts = timestamp
    for (item in attendants) {
        const text = attendants[item].join(',')
        console.log(attendants[item].length)
        const cnt = attendants[item].length
        if (item == "home") {
            messages.attachments[1].text = "*在宅*\n" + text
            messages.attachments[1].footer = "合計" + cnt + "人"
        }
        else if (item == "osaki") {
            messages.attachments[2].text = "*大崎*\n" + text
            messages.attachments[2].footer = "合計" + cnt + "人"
        }
        else {
            messages.attachments[3].text = "*その他*\n" + text
            messages.attachments[3].footer = "合計" + cnt + "人"
        }
    }
    // Headers
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    // API CALL
    try { 
        const response = await axios.post(API_ENDPOINT + "/chat.update", messages, { headers: headers })
        console.log(response.data); 
    } catch (error) { 
        console.log(error.response.body); 
    } 
}


app.get('/', (request, response) => {
    response.send('Hello, World'); 
    postAttendanceCheckPoll()
});

app.post('/endpoint', (request, response) => {
    const requestJson = JSON.parse(request.body.payload) 
    const value = requestJson.actions[0].value
    const respondent = "<@" + requestJson.user.name + ">"
    const timestamp = requestJson.message_ts
    // const value = request.body.value
    // const respondent = "<@" + request.body.user.name + ">"
    // const timestamp = 123123124
    
    const today = getToday()[1]
    
    const attendance = firebaseDb.ref('/').child('attendance/' + timestamp)
    attendance.once('value', snapshot => {
        const attendants = snapshot.val()
        if(attendants === null){
            attendance.update({
                [value]: [respondent]
            })
            const attendants = {
                [value]: [respondent]
            }
            console.log("attendants: ", attendants)
            updateAttendanceCheckPoll(timestamp, attendants)
        }
        else if (typeof attendants[value] === "undefined") {
            attendance.update({
                [value]: [respondent]
            })

            for (const item in attendants) {         
                attendants[item] = attendants[item].filter( function (user) {
                    return user != respondent
                })
            }
            attendance.update(attendants)
            attendants[value] = [respondent]
            updateAttendanceCheckPoll(timestamp, attendants)
        }
        else {
            for (const item in attendants) {
                // attendants[item] = attendants[item].split(',')
                if (item == value) {
                    if (!attendants[item].includes(respondent)) {
                        attendants[item].push(respondent)
                    }
                    else {
                        attendants[item] = attendants[item].filter( function (user) {
                            return user != respondent
                        })
                    }
                }
                else {
                    attendants[item] = attendants[item].filter( function (user) {
                        return user != respondent
                    })
                }
            } 
            attendance.update(attendants);
            updateAttendanceCheckPoll(timestamp, attendants)
        }
    })
    
    response.send(''); 

});