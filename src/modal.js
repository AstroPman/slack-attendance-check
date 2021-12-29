
const fs = require('fs');
const axios = require('axios');
const { text } = require('express');

const MODAL_API_ENDPOINT = 'https://slack.com/api'
const API_KEY = process.env.API_KEY
const headers = {
    "content-type": "application/json",
    "Authorization": 'Bearer ' + API_KEY
}



exports.openModal = async function (triggerId) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    messages.trigger_id = triggerId
        
    // API CALL
    try { 
    
        await axios.post(MODAL_API_ENDPOINT + "/views.open", messages, { headers: headers })
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }
}

exports.updateModal = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    delete messages.trigger_id
    messages.response_action = 'update'
    // messages.view_id = requestJson.view.previous_view_id
    messages.blocks = requestJson.view.blocks
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

    messages.blocks[3].elements = elements
        
    // API CALL
    // try { 
    
    //     const response = await axios.post(MODAL_API_ENDPOINT + "/views.update", messages, { headers: headers })
    //     console.log(response.data)
    
    // } catch (error) { 
    
    //     console.log(error.response); 
    
    // }
    return messages

}

exports.pushModal = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_add_options.json', 'utf8'));
    const elements = requestJson.view.blocks[3].elements
    const cnt = elements.length

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
    
    messages.trigger_id = requestJson.trigger_id

    messages.view.title.text = "Baymax Poll (updated)"
    
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.push", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}