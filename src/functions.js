const fs = require('fs');
const axios = require('axios');
const iconv = require('iconv-lite')

const weatherData = require('./weather.js')
const financeData = require('./finance.js')
const firebaseDb =  require('./firebase.js');


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
    const unixtime = date.getTime()
    const dayOfWeekStr = [ "日", "月", "火", "水", "木", "金", "土" ][dayOfWeek]
    const today = year + '年' + month + '月' + day + '日' + '(' + dayOfWeekStr + ')';
    const todayString = year.toString() + month.toString() + day.toString()
    return [today, todayString, dayOfWeekStr, day, unixtime]
}

async function insertInformation() {
    // Information
    const weather = await weatherData()
    const finance = await financeData()
    
    // Edit Messages
    const messages = JSON.parse(fs.readFileSync('./src/message_template.json', 'utf8'));
    messages.channel = CHANNEL_ID
    messages.attachments[0].blocks[0].text.text = exports.getToday()[0] + "の出社状況"
    const information = [
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `*Kyndryl株価情報*: ${finance[0]}USD :${finance[2]}: (${finance[1]}) `
                }
            ]
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "*今日の天気*"
                },
                {
                    "type": "image",
                    "image_url": weather.iconUrl,
                    "alt_text": "cute cat"
                },
                {
                    "type": "plain_text",
                    "text": `:small_orange_diamond:最高気温: ${weather.maxTemp}℃\n:small_blue_diamond:最低気温: ${weather.minTemp}℃`,
                    "emoji": true
                }
            ]
        }
        
    ]
    
    messages.attachments[1].blocks = messages.attachments[1].blocks.concat(information)

    if (exports.getToday()[2] == "月") {
    }
    else if (exports.getToday()[2] == "火") {
        
    }
    else if (exports.getToday()[2] == "水") {
        
    }
    else if (exports.getToday()[2] == "木") {
        console.log('Today is Thursday')
        const notifyTimeAtKyndryl = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "ILCの入力をお忘れなきようお願いします。"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Time@Kyndryl :arrow_upper_right:",
                    "emoji": true
                },
                "value": "click_me_123",
                "url": "https://time.ibm.com/week",
                "action_id": "time-at-kyndryl"
            }
        }
        messages.attachments[1].blocks.push(notifyTimeAtKyndryl)
        return messages
    
    }
    else if (exports.getToday()[2] == "金") {
        console.log('Today is Friday')
        const notifyTimeAtKyndryl = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "ILCの入力をお忘れなきようお願いします。"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Time@Kyndryl :arrow_upper_right:",
                    "emoji": true
                },
                "value": "click_me_123",
                "url": "https://time.ibm.com/week",
                "action_id": "time-at-kyndryl"
            }
        }
        messages.attachments[1].blocks.push(notifyTimeAtKyndryl)
        return messages

    }
    else if(exports.getToday()[2] == "土" || exports.getToday()[2] == "日") {
    }
    else {

    }

    return messages
}

exports.postAttendanceCheckPoll = async function postAttendanceCheckPoll(){
    
    const messages = await insertInformation()

    // Headers
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    
    // API CALL
    try { 

        await axios.post(API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })

    } catch (error) { 

        console.log(error.response); 

    }
}

exports.updateAttendanceCheckPoll = async function updateAttendanceCheckPoll(requestJson, attendants){
    
    const newMessages = JSON.parse(fs.readFileSync('./src/message_template.json', 'utf8'));
    newMessages.channel = requestJson.container.channel_id
    newMessages.ts = requestJson.message.ts
    newMessages.attachments = requestJson.message.attachments

    for (item in attendants) {
        const text = attendants[item].join(',')
        const cnt = attendants[item].length
        if (item == "home") {
            newMessages.attachments[3].blocks[0].text.text = ":house:  *在宅*\n" + text
            newMessages.attachments[3].blocks[1].elements[0].text = "合計" + cnt + "人"
        }
        else if (item == "osaki") {
            newMessages.attachments[4].blocks[0].text.text = ":office:  *大崎*\n" + text
            newMessages.attachments[4].blocks[1].elements[0].text = "合計" + cnt + "人"
        }
        else {
            newMessages.attachments[5].blocks[0].text.text = ":grey_question:  *その他*\n" + text
            newMessages.attachments[5].blocks[1].elements[0].text = "合計" + cnt + "人"
        }
    }
    // Headers
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }

    // API CALL
    try { 

        const response = await axios.post(API_ENDPOINT + "/chat.update", newMessages, { headers: headers })
        console.log(response.data)

    } catch (error) { 

        console.log(error.response.body); 

    } 
}

exports.postAttendanceCheckRemind = async function postAttendanceCheckRemind(){
    // Edit messages
    const messages = JSON.parse(fs.readFileSync('./src/message_template.json', 'utf8'));
    messages.channel = CHANNEL_ID
    messages.attachments[0].blocks[0].text.text = exports.getToday()[0] + "の出社状況（リマインド）"
    messages.attachments[1].blocks[0].text.text = ":bangbang: *未回答の方はご回答お願いいたします。<!channel>* :bangbang:"
    messages.attachments.splice(2, messages.attachments.length - 1)

    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }

    // API CALL
    try { 
        
        await axios.post(API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })

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

        await axios.post(API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })

    } catch (error) { 

        console.log(error.response.body); 

    } 
}

exports.deleteAttendanceDatafromFirebase = async function () {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const oneMonthBeforeUnixtime = date.getTime() * 1000
    
    const attendance = firebaseDb.ref('/attendance')
    attendance.once('value', snapshot => {
        const removeDays = Object.keys(snapshot.val()).filter(time => {
            return Number(time) < oneMonthBeforeUnixtime
        })
        console.log('1 month ago data will be deleted')
        console.log('This data will be deleted: ', removeDays)
        removeDays.forEach( timestamp => {
            attendance.update({
                [timestamp]: null
            })
        })
    })

}


// baymax poll
exports.registerAnswer = async function (requestJson) {
    const value = requestJson.actions[0].value
    const respondent = "<@" + requestJson.user.name + ">"
    const timestamp = requestJson.message.ts
            
    const polls = firebaseDb.ref('/').child('polls/' + ( Number(timestamp) * 10 ** 6).toString())
    polls.once('value', snapshot => {
        const results = snapshot.val()
        if(results === null){
            polls.update({
                [value]: [respondent]
            })
            const results = {
                [value]: [respondent]
            }
            exports.updatePoll(requestJson, results)
        }
        else if (typeof results[value] === "undefined") {
            polls.update({
                [value]: [respondent]
            })

            for (const item in results) {         
                results[item] = results[item].filter( function (user) {
                    return user != respondent
                })
            }
            polls.update(results)
            results[value] = [respondent]
            exports.updatePoll(requestJson, results)
        }
        else {
            for (const item in results) {
                if (item == value) {
                    if (!results[item].includes(respondent)) {
                        results[item].push(respondent)
                    }
                    else {
                        results[item] = results[item].filter( function (user) {
                            return user != respondent
                        })
                    }
                }
                else {
                    results[item] = results[item].filter( function (user) {
                        return user != respondent
                    })
                }
            } 
            polls.update(results);
            exports.updatePoll(requestJson, results)
        }
    })
}

exports.updatePoll = async function (requestJson, respondents){
    const newMessages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    newMessages.channel = requestJson.channel.id
    newMessages.ts = requestJson.message.ts
    newMessages.blocks = requestJson.message.blocks

    console.log("respondents: ", respondents)

    for (let i = 4; i < newMessages.blocks.length; i ++) {
        console.log(i)
        for (key in respondents) {
            console.log('key: ', key)
            const text = respondents[key].join(',')
            const cnt = respondents[key].length
            
            if (newMessages.blocks[i].block_id.match(/option/)) {
                console.log("newMessages.blocks[i].value: ", newMessages.blocks[i].value)
                if (newMessages.blocks[i].block_id == key){
                    newMessages.blocks[i].text.text = "OPTION \n" + text
                    newMessages.blocks[i + 1].elements[0].text = "合計" + cnt + "人"
                    console.log("========================================")
                    console.log(newMessages.blocks[i].text.text)
                    console.log(newMessages.blocks[i + 1].elements[0].text)
                }
            }
        }
    }

    console.log("messages: ", newMessages)
    
    // Headers
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }

    // API CALL
    try { 

        const response = await axios.post(API_ENDPOINT + "/chat.update", newMessages, { headers: headers })
        console.log(response.data)

    } catch (error) { 

        console.log(error.response.body); 

    } 
}

exports.isHoliday = async function () {
    try { 
        
        const response = await axios.get('https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv', {
            responseType: 'arraybuffer',
            responseEncoding: 'binary'
        })
        const str = iconv.decode(response.data, "Shift-JIS")
        console.log(str.toCS)
    } catch (error) { 
        
        console.log(error.response); 

    } 
    
}
