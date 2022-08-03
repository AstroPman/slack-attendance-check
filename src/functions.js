const fs = require('fs');
const axios = require('axios');
const iconv = require('iconv-lite')

const weatherData = require('./weather.js')
const financeData = require('./finance.js')
const firebase =  require('./firebase.js')
const db = firebase.db
const fireStore = firebase.fireStore




/*

Initialize

*/
const CHANNEL_ID = process.env.CHANNEL_ID_PROD // kmp_kk_出社状況確認
// const CHANNEL_ID = process.env.CHANNEL_ID_TEST; // baymax-sandbox
const API_KEY = process.env.API_KEY
const API_ENDPOINT = "https://slack.com/api"

/* 

Functions

*/

// general functions
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
    const newYear = 1672498800000 // 2023年1月1日 ms
    const dayOfWeekStr = [ "日", "月", "火", "水", "木", "金", "土" ][dayOfWeek]
    const engDate = date.toDateString()
    const today = year + '年' + month + '月' + day + '日' + '(' + dayOfWeekStr + ')';
    const todayString = year.toString() + month.toString() + day.toString()
    const todayStringDash =  year.toString() + '-' + month.toString().padStart(2, '0') + '-' + day.toString().padStart(2, '0')
    const time = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0') // hh:mm
    const diff = newYear - unixtime
    const countdown = Math.floor(diff/(24 * 60 * 60 * 1000))
    return [today, todayString, dayOfWeekStr, day, unixtime, countdown, engDate, todayStringDash, time]
}

async function insertInformation() {
    // Information
    const weather = await weatherData()
    const finance = await financeData()
    
    // Edit Messages
    const messages = JSON.parse(fs.readFileSync('./src/message_templates/block_attendance_check.json', 'utf8'));
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

// attendance check functions
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
    
    const newMessages = JSON.parse(fs.readFileSync('./src/message_templates/block_attendance_check.json', 'utf8'));
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
    const messages = JSON.parse(fs.readFileSync('./src/message_templates/block_attendance_check.json', 'utf8'));
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

exports.postFirebaseDeleteResult = async function postFirebaseDeleteResult(cnt_deleted_poll){
    const today = exports.getToday()[6]
    const title = today + ": Firebase Data Delete Result"
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    
    const messages = {
        "channel": "C02QMRLRQ75",  //baymax_sandbox
        "attachments": [
            {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*" + title + "Firebase Data Delete Result*\n:blue-check: " + cnt_deleted_poll + " polls have been deleted."
                        }
                    }
                ]
            }
        ]
    }
    
    
    // API CALL
    try { 

        await axios.post(API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })

    } catch (error) { 

        console.log(error.response); 

    } 

}

exports.deleteOldDatafromFirebase = async function () {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const oneMonthBeforeUnixtime = date.getTime() * 1000

    // delete data from attendance
    const attendance = db.ref('/attendance')
    attendance.once('value', snapshot => {
        const removeDays = Object.keys(snapshot.val()).filter(time => {
            console.log('time: ', time)
            return Number(time) < oneMonthBeforeUnixtime
        })
        console.log('removeDays: ',removeDays)
        removeDays.forEach( timestamp => {
            attendance.update({
                [timestamp]: null
            })
        })
        cnt_deleted_poll = removeDays.length
        exports.postFirebaseDeleteResult(cnt_deleted_poll)
    })

    // delete data from polls
    const polls = db.ref('/polls')
    polls.once('value', snapshot => {
        const removeDays = Object.keys(snapshot.val()).filter(time => {
            console.log('time: ', time)
            return Number(time) < oneMonthBeforeUnixtime
        })
        console.log('removeDays: ',removeDays)
        removeDays.forEach( timestamp => {
            polls.update({
                [timestamp]: null
            })
        })
        cnt_deleted_poll = removeDays.length
        exports.postFirebaseDeleteResult(cnt_deleted_poll)
    })

}

exports.attendanceCheckMain = async function (requestJson) {
    // extranct data from request
    const value = requestJson.actions[0].value
    const respondent = "<@" + requestJson.user.name + ">"
    const timestamp = requestJson.message.ts
    
    // firebase realtime database
    const attendance = db.ref('/').child('attendance/' + ( Number(timestamp) * 10 ** 6).toString())
    
    // overwrite attendance status
    attendance.once('value', snapshot => {
        const attendants = snapshot.val()
        if(attendants === null){
            attendance.update({
                [value]: [respondent]
            })
            const attendants = {
                [value]: [respondent]
            }
            // functions.updateAttendanceCheckPoll(requestJson, attendants)
            exports.updateAttendanceCheckPoll(requestJson, attendants)
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
            // functions.updateAttendanceCheckPoll(requestJson, attendants)
            exports.updateAttendanceCheckPoll(requestJson, attendants)
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
            // functions.updateAttendanceCheckPoll(requestJson, attendants)
            exports.updateAttendanceCheckPoll(requestJson, attendants)
        }
    })
}

// Meeting Notification Functrions
exports.postCloudMeeting = async function postCloudMeeting(){
    // Edit messages
    const messages = JSON.parse(fs.readFileSync('./src/message_templates/block_meeting_agenda.json', 'utf8'));
    messages.channel = "C02JLJFPJ5S"  //infra-unyo
    // messages.channel = "C02QMRLRQ75"  //baymax_sandbox
    const today = exports.getToday()
    messages.blocks[6].elements[0].text = ":mscalendar: " + today[0] + "（2023年まであと" + today[5] + "日）"
    
    const dayOfWeek = today[2]
    if (dayOfWeek == "木") {
        messages.blocks[4] = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*:large_yellow_circle:  本日の連絡*\n明日のお客様定例の実施内容につきまして相談させてください。"
			}
		}
    }

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

// Baymax Poll Functions
exports.registerAnswer = async function (requestJson) {
    const value = requestJson.actions[0].value
    const respondent = "<@" + requestJson.user.name + ">"
    const timestamp = requestJson.message.ts
    const signature = requestJson.message.blocks[requestJson.message.blocks.length - 1].elements[0].text
    const isMultipleSelection = signature.includes('Multiple')
            
    const polls = db.ref('/').child('polls/' + ( Number(timestamp) * 10 ** 6).toString())
    polls.once('value', snapshot => {
        const results = snapshot.val()
        // 初回回答（pollの回答が一つも存在しない場合）
        if(results === null){
            polls.update({
                [value]: [respondent]
            })
            const results = {
                [value]: [respondent]
            }
            exports.updatePoll(requestJson, results)
        }
        // 初選択（初めて該当の選択肢が選択された場合）
        else if (typeof results[value] === "undefined") {
            polls.update({
                [value]: [respondent]
            })

            if(!isMultipleSelection) {
                for (const item in results) {         
                    results[item] = results[item].filter( function (user) {
                        return user != respondent
                    })
                }
            }
            polls.update(results)
            results[value] = [respondent]
            exports.updatePoll(requestJson, results)
        }
        // 全ての選択肢が一度以上選択されたことある場合
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
                    if(!isMultipleSelection){
                        results[item] = results[item].filter( function (user) {
                            return user != respondent
                        })
                    }
                }
            } 
            polls.update(results);
            exports.updatePoll(requestJson, results)
        }
    })
}

exports.updatePoll = async function (requestJson, respondents){
    const newMessages = JSON.parse(fs.readFileSync('./src/message_templates/block_poll_template.json', 'utf8'));
    newMessages.channel = requestJson.channel.id
    newMessages.ts = requestJson.message.ts
    newMessages.blocks = requestJson.message.blocks
    const signature = requestJson.message.blocks[requestJson.message.blocks.length - 1].elements[0].text
    const isAnonymous = signature.includes('Anonymous')
    const silhouetteIcon =  ":bust_in_silhouette: "

    for (let i = 4; i < newMessages.blocks.length; i ++) {
        for (key in respondents) {
            const text = respondents[key].join(',')
            const cnt = respondents[key].length
            
            if (newMessages.blocks[i].block_id.match(/option/)) {
                if (newMessages.blocks[i].block_id == key){
                    const textHeader = newMessages.blocks[i].text.text.split('\n')[0]
                    newMessages.blocks[i].text.text = isAnonymous ? textHeader + "\n" + silhouetteIcon.repeat(cnt) : textHeader + "\n" + text 
                    newMessages.blocks[i + 1].elements[0].text = "合計" + cnt + "人"
                }
            }
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


// Baymax Reminder Functions
exports.registerReminder = async function (requestJson) {

    const values = requestJson.view.state.values
    const ts = values.reminder_date.remind_datepicker.selected_date + ' ' + values.reminder_time.remind_timepicker.selected_time
    const reccurenceSetting = requestJson.view.blocks[requestJson.view.blocks.length - 1].text.text
    
    let reccurence = {}
    if (reccurenceSetting.includes('Weekly')){
        reccurence = {
            pattern: 'weekly',
            rule: {
                sun: reccurenceSetting.includes('Sunday'),
                mon: reccurenceSetting.includes('Monday'),
                tue: reccurenceSetting.includes('Tuesday'),
                wed: reccurenceSetting.includes('Wednesday'),
                thu: reccurenceSetting.includes('Thursday'),
                fri: reccurenceSetting.includes('Friday'),
                sat: reccurenceSetting.includes('Saturday')
            }
        }
    }
    else if(reccurenceSetting.includes('Monthly')){
        reccurence = {
        // Monthly用設定
        }
    }
    else if(reccurenceSetting.includes('Yearly')){
        reccurence = {
        // Yearly用設定
        }
    }

    const reminder = {
        content: values.reminder_content['plain_text_input-action'].value,
        conversation: values.reminder_conversation['conversations_select-action'].selected_conversation,
        start: Date.parse(ts.replace( /-/g,'/'))/1000,
        reccurence: reccurence
    }
    
    fireStore.collection("reminders").add(reminder)
    .then((docRef) => {
        console.log("Document written with ID: ", docRef.id)
    })
    .catch((error) => {
        console.error("Error adding document: ", error);
    });


    // 2. schedule the reminder
    // const ref = fireStore.collection("reminders");
    // const snapshot = await ref.get();
    
    // snapshot.docs.map(s => console.log(s.data()))
}

exports.getReminders = async function () {
    const ref = fireStore.collection("reminders");
    const snapshot = await ref.get();
    return snapshot.docs.map(s => s.data());
}