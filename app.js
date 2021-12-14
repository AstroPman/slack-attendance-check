const express　=　require('express');
const fs = require('fs');
const axios = require('axios'); 

// const CHANNEL_ID = "C0285T7SL4X"; // kmp_kk_出社状況確認
const CHANNEL_ID = "C02QMRLRQ75"; // baymax-sandbox
const API_ENDPOINT = "https://slack.com/api"

const date  = new Date();
const year  = date.getFullYear();
const month = date.getMonth() + 1;
const day   = date.getDate();
const today = (year + '年' + month + '月' + day + '日');

const app = express();
const port=process.env.PORT || 8080;
app.get('/', (req, res)=>{ res.send('Hello, World'); });
app.listen(port, ()=>{ console.log(`Express Server Listen START at port=${port}`); });


const message = JSON.parse(fs.readFileSync('./message_template.json', 'utf8'));
message.channel = CHANNEL_ID
message.blocks[0].text.text = "*" + today + "の出社状況*<!channel>"



async function postAttendanceCheckPoll(){ 
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer xoxb-2264321203926-2673794707732-sNrpL1mQn3Wn1vgVHQWkmFL3'
    }
    try { 
        const response = await axios.post(API_ENDPOINT + "/chat.postMessage", message, { headers: headers })
        console.log(response.data); 
    } catch (error) { 
        console.log(error.response.body); 
    } 
}

// const headers = {
//             "content-type": "application/json",
//             "Authorization": 'Bearer xoxb-2264321203926-2673794707732-sNrpL1mQn3Wn1vgVHQWkmFL3'
//         }

// axios.post(API_ENDPOINT + "/chat.postMessage", message, {headers: headers}).then(response => {
//     console.log(response.data);
// })

postAttendanceCheckPoll()

