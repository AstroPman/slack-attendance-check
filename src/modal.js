const fs = require('fs');
const axios = require('axios');

const functions = require('./functions.js');

const MODAL_API_ENDPOINT = 'https://slack.com/api'
const API_KEY = process.env.API_KEY
const headers = {
    "content-type": "application/json",
    "Authorization": 'Bearer ' + API_KEY
}


/*

Baymax Poll

*/

exports.openModal = async function (triggerId) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_create_poll.json', 'utf8'));
    messages.trigger_id = triggerId
        
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.open", messages, { headers: headers })
        console.log("openModal response: ", response.data)
        console.log("openModal response: ", response.data.view.blocks)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }
}

exports.updateModal = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_create_poll.json', 'utf8'));
    delete messages.trigger_id
    messages.view_id = requestJson.view.previous_view_id
    const privateMetadata = JSON.parse(requestJson.view.private_metadata)
    messages.view.blocks = privateMetadata

    const elements = []
    const values = requestJson.view.state.values
    for (const key in values) {
        elements.push(
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": values[key]['plain_text_input-action'].value,
                    "emoji": true
                },
                "value": values[key]['plain_text_input-action'].value,
                "action_id": key
            }
        )
    }
    elements.push(
        {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": ":add-ico: Add Options",
                "emoji": true
            },
            "value": "add_options",
            "action_id": "add_options",
            "style": "primary"
        }
    )

    messages.view.blocks[3].elements = elements
        
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.update", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}

exports.pushModal = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_add_options.json', 'utf8'));
    const rootViewBlocks = requestJson.view.blocks
    const elements = requestJson.view.blocks[3].elements
    const cnt = elements.length

    if (cnt == 1) {
        messages.view.blocks.splice(1 , 0, {
            "type": "input",
            "element": {
                "type": "plain_text_input",
                "action_id": "plain_text_input-action",
            },
            "label": {
                "type": "plain_text",
                "text": "Option 1",
                "emoji": true
            }
        })
    }
    else {
        for (let i = 0; i < cnt - 1; i ++) {
            const num = i + 1
            messages.view.blocks.splice(num , 0, {
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "plain_text_input-action",
                    "initial_value": elements[i].text.text
                },
                "label": {
                    "type": "plain_text",
                    "text": "Option " + num,
                    "emoji": true
                }
            })
    
        }
    }

    
    messages.trigger_id = requestJson.trigger_id
    messages.view.private_metadata = JSON.stringify(rootViewBlocks)
        
    
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.push", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}

exports.addInputForm = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_add_options.json', 'utf8'));
    messages.view.blocks = requestJson.view.blocks
    messages.view.private_metadata = requestJson.view.private_metadata
    messages.view_id = requestJson.view.id
    delete messages.trigger_id
    const num = messages.view.blocks.length - 1
    messages.view.blocks.splice(-1, 0, {
        "type": "input",
        "element": {
            "type": "plain_text_input",
            "action_id": "plain_text_input-action",
        },
        "label": {
            "type": "plain_text",
            "text": "Option " + num,
            "emoji": true
        }
    })

    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.update", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}

exports.removeInputForm = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_add_options.json', 'utf8'));
    messages.view.blocks = requestJson.view.blocks
    messages.view.private_metadata = requestJson.view.private_metadata
    messages.view_id = requestJson.view.id
    delete messages.trigger_id
    const num = messages.view.blocks.length - 1
    
    // Only when two or more input forms exist
    if (num > 2) {
        messages.view.blocks.splice(-2, 1)
        // API CALL
        try { 
    
            const response = await axios.post(MODAL_API_ENDPOINT + "/views.update", messages, { headers: headers })
            console.log(response.data)
        
        } catch (error) { 
        
            console.log(error.response); 
        
        }
    }

    
    

}

exports.postPoll = async function (requestJson) {
    // load message template
    const messages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    
    // extract data from request
    const userName = requestJson.user.username
    const title = requestJson.view.state.values["title"]['plain_text_input-action'].value
    const descriptionContent = requestJson.view.state.values["description"]['plain_text_input-action'].value
    const channelId = requestJson.view.state.values["channel"].conversations_select.selected_conversation
    const elements = requestJson.view.blocks[3].elements.slice(0, -1)  // extract created options
    const options = []
    elements.forEach(element => {
        options.push(element.text.text)
    });

    // advanced settings
    const settings = requestJson.view.blocks[6].elements
    const advancedSettings = {
        isNotifyAtChannel: settings[0].value == "true",
        isAnonymous: settings[1].value == "true",
        isNotifyToUsers: settings[2].value == "true",
        isMultipleSelection: settings[3].value == "true",
        isPostInThread: settings[4].value == "true"
    }
    let description = advancedSettings.isNotifyAtChannel ? ":speech_balloon:  *Description*  <!channel>\n" + descriptionContent : ":speech_balloon:  *Description*\n" + descriptionContent
    const today = functions.getToday()[6]
    const signature = `Created by ${ userName } @Batymax Poll ${ advancedSettings.isAnonymous ? "| Anonymous Poll" : "" } ${ advancedSettings.isMultipleSelection ? "| Multiple Selection" : "| Single Selection"}`
    const userList =  advancedSettings.isNotifyToUsers ? requestJson.view.state.values['notify_to_users']['multi_users_select-action'].selected_users : null
    let users = ""
    if(userList){
        userList.forEach(userId => {
            users += '<@' + userId + '>'
        })
        description += '\n' + users
    }

    const threadUrl = advancedSettings.isPostInThread ? requestJson.view.state.values["post_in_thread"]["plain_text_input-action"].value : null
     
    const threadTimestamp = function (threadUrl) {
        if(threadUrl != null) {
            const ts = threadUrl.split('/').pop().replace('p','')
            const threadTimestamp = (Number(ts) * 10 ** (-6)).toFixed(6)
            return threadTimestamp
        }
        else{
            return null
        }
    }


    // Edit new messages
    messages.channel = channelId
    messages.thread_ts = threadTimestamp(threadUrl)
    messages.blocks[0].text.text = title
    messages.blocks[1].text.text = description
    
    options.forEach((option, index) => {
        const num = index + 1
        messages.blocks[2].elements.push(
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": option,
                    "emoji": true
                },
                "value": "option_" + num,
                "action_id": "option_" + num
            }
        )

        messages.blocks.push(
            {
                "block_id": "option_" + num,
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*" + option + "*"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "合計0人"
                    }
                ]
            },
        )
        
    });

    messages.blocks.push( // insert signature block in the end
        {
            "type": "divider"
        },
        {
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": signature
				}
			]
		}
    )

    // API CALL
    try { 

        const response = await axios.post(MODAL_API_ENDPOINT + "/chat.postMessage", messages, { headers: headers })
        console.log("postPoll response.data: ", response.data)

    } catch (error) { 

        console.log("postPoll error.response: ", error.response); 

    }
}

exports.updateButtons = async function(requestJson) {
    // load message template
    const messages = JSON.parse(fs.readFileSync('./src/message_template_create_poll.json', 'utf8'));
    
    // overwrite template with request data
    messages.view.blocks = requestJson.view.blocks
    messages.view_id = requestJson.view.id
    delete messages.trigger_id

    // extract data from request
    const actionId = requestJson.actions[0].action_id
    
    if (actionId == "is_notify_at_channel") {
        const isCurrentValueTrue = messages.view.blocks[6].elements[0].value == "true"
        messages.view.blocks[6].elements[0].value = isCurrentValueTrue ? "false" : "true"
        messages.view.blocks[6].elements[0].text.text = isCurrentValueTrue ? "Notify at channel" : ":heavy_check_mark: Notify at channel"
        
        if (isCurrentValueTrue) {
            // remove style property to make the button style set default
            delete messages.view.blocks[6].elements[0].style
        }else{
            // overwite button style to primary
            messages.view.blocks[6].elements[0].style = "primary"
        }
    }
    else if (actionId == "is_anonymous") {
        const isCurrentValueTrue = messages.view.blocks[6].elements[1].value == "true"
        messages.view.blocks[6].elements[1].value = isCurrentValueTrue ? "false" : "true"
        messages.view.blocks[6].elements[1].text.text = isCurrentValueTrue ? "Anonymous" : ":heavy_check_mark: Anonymous"
        if (isCurrentValueTrue) {
            // remove style property to make the button style set default
            delete messages.view.blocks[6].elements[1].style
        }else{
            // overwite button style to primary
            messages.view.blocks[6].elements[1].style = "primary"
        }
    }
    else if (actionId == "is_notify_to_user") {
        const isCurrentValueTrue = messages.view.blocks[6].elements[2].value == "true"
        messages.view.blocks[6].elements[2].value = isCurrentValueTrue ? "false" : "true"
        messages.view.blocks[6].elements[2].text.text = isCurrentValueTrue ? "Notify to User" : ":heavy_check_mark: Notify to User"
        if (isCurrentValueTrue) {
            // remove style property to make the button style set default
            delete messages.view.blocks[6].elements[2].style
            // remove multi-user-select form
            messages.view.blocks = messages.view.blocks.filter(element => {
                return element.block_id != "notify_to_users"
            })
        }else{
            // overwite button style to primary
            messages.view.blocks[6].elements[2].style = "primary"
            // add multi-user-select form
            messages.view.blocks.push({
                "type": "input",
                "block_id": "notify_to_users",
                "element": {
                    "type": "multi_users_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select users",
                        "emoji": true
                    },
                    "action_id": "multi_users_select-action"
                },
                "label": {
                    "type": "plain_text",
                    "text": "Users",
                    "emoji": true
                }
            })
        }
    }
    else if (actionId == "is_multiple_selection") {
        const isCurrentValueTrue = messages.view.blocks[6].elements[3].value == "true"
        messages.view.blocks[6].elements[3].value = isCurrentValueTrue ? "false" : "true"
        messages.view.blocks[6].elements[3].text.text = isCurrentValueTrue ? "Multiple Seletion" : ":heavy_check_mark: Multiple Seletion"
        if (isCurrentValueTrue) {
            // remove style property to make the button style set default
            delete messages.view.blocks[6].elements[3].style
        }else{
            // overwite button style to primary
            messages.view.blocks[6].elements[3].style = "primary"
        }
    }
    else if (actionId == "is_post_in_thread") {
        const isCurrentValueTrue = messages.view.blocks[6].elements[4].value == "true"
        messages.view.blocks[6].elements[4].value = isCurrentValueTrue ? "false" : "true"
        messages.view.blocks[6].elements[4].text.text = isCurrentValueTrue ? "Post in thread" : ":heavy_check_mark: Post in thread"
        if (isCurrentValueTrue) {
            // remove style property to make the button style set default
            delete messages.view.blocks[6].elements[4].style
            // remove multi-user-select form
            messages.view.blocks = messages.view.blocks.filter(element => {
                return element.block_id != "post_in_thread"
            })
        }else{
            // overwite button style to primary
            messages.view.blocks[6].elements[4].style = "primary"
            // add multi-user-select form
            messages.view.blocks.push(
                {
                    "type": "input",
                    "block_id": "post_in_thread",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "plain_text_input-action"
                    },
                    "hint": {
                        "type": "plain_text",
                        "text": "Provide Link URL of parent post of thread"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Thread URL",
                        "emoji": true
                    }
                })
        }
    }
    
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.update", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}


/*

Baymax Reminder

*/

exports.openReminder = async function (triggerId) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_create_reminder.json', 'utf8'));
    const initial_date = functions.getToday()[7]
    const initial_time = functions.getToday()[8]
    
    messages.trigger_id = triggerId
    messages.view.blocks[3].elements[0].initial_date = initial_date
    messages.view.blocks[3].elements[1].initial_time = initial_time
        
    try {     
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.open", messages, { headers: headers })
        console.log("openModal response: ", response.data)
        console.log("openModal response: ", response.data.view.blocks)
    
    } catch (error) { 
        console.log(error.response); 
    }
}

exports.pushReccurenceSetting = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_reccurence_setting.json', 'utf8'));
    const rootViewBlocks = requestJson.view.blocks
    messages.trigger_id = requestJson.trigger_id
    messages.view.private_metadata = JSON.stringify(rootViewBlocks)
        
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.push", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}

exports.updateReccurenceSetting = async function (requestJson) {
    
    const selected_value = requestJson.actions[0].selected_option.value
    console.log('requestJson.actions[0].selected_option: ', requestJson.actions[0].selected_option)
    console.log('selected_value: ', selected_value)
    const messages = JSON.parse(fs.readFileSync('./src/message_template_add_options.json', 'utf8'));
    messages.view.blocks = requestJson.view.blocks
    messages.view.private_metadata = requestJson.view.private_metadata
    messages.view_id = requestJson.view.id
    delete messages.trigger_id

    if (selected_value == 'static_select_reminder_weekly'){
        const reccurenceSetting = {
            "type": "actions",
            "elements": [
                {
                    "type": "checkboxes",
                    "options": [
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Sunday",
                                "emoji": true
                            },
                            "value": "checkbox_sunday"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Monday",
                                "emoji": true
                            },
                            "value": "checkbox_monday"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Tuesday",
                                "emoji": true
                            },
                            "value": "checkbox_tuesday"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Wednesday",
                                "emoji": true
                            },
                            "value": "checkbox_wednesday"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Thursday",
                                "emoji": true
                            },
                            "value": "checkbox_thursday"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Friday",
                                "emoji": true
                            },
                            "value": "checkbox_friday"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Saturday",
                                "emoji": true
                            },
                            "value": "checkbox_saturday"
                        }
                    ],
                    "action_id": "checkbox_action_choose_day"
                }
            ]
        }
    }
    else if(selected_value == 'static_select_reminder_monthly'){
        const reccurenceSetting = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "This feature is comming Soon :bow:"
			}
		}
    }
    else if(selected_value == 'static_select_reminder_yearly'){
        const reccurenceSetting = {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "This feature is comming Soon :bow:"
			}
		}
    }

    messages.view.blocks.push(reccurenceSetting)

    // API CALL
    try { 
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.update", messages, { headers: headers })
        console.log(response.data)
    } catch (error) { 
        console.log(error.response);
    }    
}