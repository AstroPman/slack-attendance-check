const express　=　require('express');
const fs = require('fs');
const axios = require('axios');
const admin = require("firebase-admin");

// Fetch the service account key JSON file contents
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://slack-attendance-check-default-rtdb.asia-southeast1.firebasedatabase.app"
});
var db = admin.database();

// Date
const date  = new Date();
const year  = date.getFullYear();
const month = date.getMonth() + 1;
const day   = date.getDate();
const today = (year + '年' + month + '月' + day + '日');
const todayString = year.toString() + month.toString() + day.toString()

// As an admin, the app has access to read and write all data, regardless of Security Rules

var attendance = db.ref("/attendance/" + todayString);
attendance.set({
  osaki: "test1,test2"
});

require('dotenv').config();
console.log(process.env.CHANNEL_ID_PROD)

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
    console.log(request.body.payload)
    response.send(''); 
});