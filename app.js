const express　=　require('express');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();


// Date
const date  = new Date();
const year  = date.getFullYear();
const month = date.getMonth() + 1;
const day   = date.getDate();
const today = (year + '年' + month + '月' + day + '日');
const todayString = year.toString() + month.toString() + day.toString()

// Firebase Realtime Database
const admin = require("firebase-admin");
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);
// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://slack-attendance-check-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = admin.database();
const osaki = db.ref("/attendance/" + todayString + "/osaki");
const home = db.ref("/attendance/" + todayString + "/home");
const others = db.ref("/attendance/" + todayString + "/others");

osaki.on('value', snapshot => {
    console.log(snapshot.val())
})
// attendance.set({
//   osaki: "test1,test2"
// });


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
messages.blocks[0].text.text = "*" + today + "の出社状況*<!channel>"

async function postAttendanceCheckPoll(){ 
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    try { 
        const response = await axios.post(API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })
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
    requestJson = JSON.parse(request.body.payload)
    const value = requestJson.actions[0].value
    const userName = "<@" + requestJson.user.name + ">"
    console.log(value, userName)
    if (value == "osaki") {
        osaki.on('value', snapshot => {
            let attendants = snapshot.val().split(',')
            console.log(attendants)
            // 追加処理
            if (!attendants.includes(userName)) {
                attendants.push(userName)
                const newAttendants = attendants.join(',')
            }
            //削除処理
            else {
                const filteredAttendants =  attendants.filter( user => {
                    return !user == userName
                })
                const newAttendants = filteredAttendants.join(',')
            }
        osaki.set(newAttendants)
        })
    }
    response.send(''); 
});