const fs = require('fs');
const axios = require('axios');

const MODAL_API_ENDPOINT = 'https://slack.com/api'
const API_KEY = process.env.API_KEY
const headers = {
    "content-type": "application/json",
    "Authorization": 'Bearer ' + API_KEY
}



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
    console.log("requestJson.view.private_metadata: ", requestJson.view.private_metadata)
    const privateMetadata = JSON.parse(requestJson.view.private_metadata)
    messages.view.blocks = privateMetadata
    console.log('privatetadata: ', privateMetadata)
    // messages.view.blocks[0].element.initial_value = rootViewState.values[Object.keys(rootViewState.values)[0]]['plain_text_input-action'].value
    // messages.view.blocks[1].element.initial_value = rootViewState.values[Object.keys(rootViewState.values)[1]]['plain_text_input-action'].value
    
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
    const messages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    const keys = Object.keys(requestJson.view.state.values)
    const title = requestJson.view.state.values[keys[0]]['plain_text_input-action'].value
    const description = requestJson.view.state.values[keys[1]]['plain_text_input-action'].value
    const channelId = requestJson.view.state.values[keys[2]].conversations_select.selected_conversation
    const elements = requestJson.view.blocks[3].elements.slice(0, -1)
    const options = []
    elements.forEach(element => {
        options.push(element.text.text)
    });

    messages.channel = channelId
    messages.attachments[0].blocks[0].text.text = title
    messages.attachments[1].blocks[0].text.text = "*Description* \n" + description
    
    options.forEach((option, index) => {
        const num = index + 1
        messages.attachments[1].blocks[1].elements.push({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": option,
                        "emoji": true
                    },
                    "style": "primary",
                    "value": "option_" + num,
                    "action_id": "option_" + num
                }
            ]
        })

        messages.attachments[2].blocks.push(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": option
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "plain_text",
                        "text": "合計0人",
                        "emoji": true
                    }
                ]
            },
            {
                "type": "divider"
            }
        )
        
    });

    // API CALL
    try { 

        const response = await axios.post(MODAL_API_ENDPOINT + "/chat.update", newMessages, { headers: headers })
        console.log(response.data)

    } catch (error) { 

        console.log(error.response); 

    } 
    
    

}