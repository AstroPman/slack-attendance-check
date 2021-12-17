const fs = require('fs');
const axios = require('axios');

const weatherData = require('./weather.js')

// Slack Configureation
const CHANNEL_ID = process.env.CHANNEL_ID_PROD; // kmp_kk_出社状況確認
// const CHANNEL_ID = process.env.CHANNEL_ID_TEST; // baymax-sandbox
const API_KEY = process.env.API_KEY
const API_ENDPOINT = "https://slack.com/api"

exports.getToday = function getToday () {
    // Date
    const date  = new Date();
    const year  = date.getFullYear();
    const month = date.getMonth() + 1;
    const day   = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const dayOfWeek = date.getDay()
    const dayOfWeekStr = [ "日", "月", "火", "水", "木", "金", "土" ][dayOfWeek]
    const today = year + '年' + month + '月' + day + '日' + '(' + dayOfWeekStr + ')';
    const todayString = year.toString() + month.toString() + day.toString()
    return [today, todayString, dayOfWeekStr, day]
}

exports.postAttendanceCheckPoll = async function postAttendanceCheckPoll(){
    // Weather
    const weather = await weatherData()
    console.log('weather: ', weather)

    // Edit messages
    const messages = JSON.parse(fs.readFileSync('./src/message_template.json', 'utf8'));
    messages.channel = CHANNEL_ID
    messages.attachments[0].blocks[0].text.text = exports.getToday()[0] + "の出社状況"
    messages.attachments[0].blocks[2].text.text =`*出社状況を教えてください。*<!channel>\n今日の大崎の天気: ${weather.description}\n:small_orange_diamond: 最高気温: *${weather.maxTemp}℃*\n:small_blue_diamond: 最低気温: *${weather.minTemp}℃*`
    messages.attachments[0].blocks[2].accessory.image_url = weather.iconUrl
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

exports.updateAttendanceCheckPoll = async function updateAttendanceCheckPoll(timestamp, attendants){
    
    const weather = await weatherData()
    const messages = JSON.parse(fs.readFileSync('./src/message_template.json', 'utf8'));
    messages.channel = CHANNEL_ID
    messages.ts = timestamp
    messages.attachments[0].blocks[0].text.text = exports.getToday()[0] + "の出社状況"
    messages.attachments[0].blocks[2].text.text =`*出社状況を教えてください。*<!channel>\n今日の大崎の天気: ${weather.description}\n:small_orange_diamond: 最高気温: *${weather.maxTemp}℃*\n:small_blue_diamond: 最低気温: *${weather.minTemp}℃*`
    messages.attachments[0].blocks[2].accessory.image_url = weather.iconUrl

    for (item in attendants) {
        const text = attendants[item].join(',')
        console.log(attendants[item].length)
        const cnt = attendants[item].length
        if (item == "home") {
            messages.attachments[1].blocks[0].text.text = ":house:  *在宅*\n" + text
            messages.attachments[1].blocks[1].elements[0].text = "合計" + cnt + "人"
        }
        else if (item == "osaki") {
            messages.attachments[2].blocks[0].text.text = ":office:  *大崎*\n" + text
            messages.attachments[2].blocks[1].elements[0].text = "合計" + cnt + "人"
        }
        else {
            messages.attachments[3].blocks[0].text.text = ":grey_question:  *その他*\n" + text
            messages.attachments[3].blocks[1].elements[0].text = "合計" + cnt + "人"
        }
    }
    // Headers
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    console.log(messages)
    // API CALL
    try { 
        const response = await axios.post(API_ENDPOINT + "/chat.update", messages, { headers: headers })
        console.log(response.data); 
    } catch (error) { 
        console.log(error.response.body); 
    } 
}

exports.postAttendanceCheckRemind = async function postAttendanceCheckRemind(){
    // Edit messages
    const messages = JSON.parse(fs.readFileSync('./src/message_template.json', 'utf8'));
    messages.channel = CHANNEL_ID
    messages.attachments[0].blocks[0].text.text = exports.getToday()[0] + "の出社状況（リマインド）"
    messages.attachments[0].blocks[2].text.text = ":bangbang:* 未回答の方はご回答お願いいたします。<!channel> *:bangbang:"
    delete messages.attachments[0].blocks[2].accessory
    messages.attachments.splice(1,messages.attachments.length - 1)
    messages.attachments[0].blocks.splice(3, 1)

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

exports.postCloudMeeting = async function postCloudMeeting(){
    // Edit messages
    const messages = JSON.parse(fs.readFileSync('./src/message_template_cloud_meeting.json', 'utf8'));
    messages.channel = "C02JLJFPJ5S"
    // messages.channel = CHANNEL_ID
    const today = exports.getToday()
    const countdown = 31 - today[3]
    messages.blocks[4].elements[0].text = ":mscalendar: " + today[0] + "（2022年まであと" + countdown + "日）"

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
