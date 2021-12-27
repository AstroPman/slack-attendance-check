
const fs = require('fs');
const axios = require('axios');
const { text } = require('express');

const MODAL_API_ENDPOINT = 'https://slack.com/api'



exports.openModal = async function (triggerId) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    messages.trigger_id = triggerId
    const API_KEY = process.env.API_KEY

    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    
    // API CALL
    try { 
    
        await axios.post(MODAL_API_ENDPOINT + "/views.open", messages, { headers: headers })
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }
}

exports.updateModal = async function (requestJson) {
    const messages = JSON.parse(fs.readFileSync('./src/message_template_poll.json', 'utf8'));
    // delete messages.trigger_id
    messages.view_id = requestJson.container.view_id
    messages.blocks = requestJson.view.blocks

    messages.view.title.text = "Baymax Poll (updated)"
    const API_KEY = process.env.API_KEY
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    
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
    const cnt = requestJson.view.blocks[3].elements.length

    for (let i = 0; i < cnt - 1; i ++) {
        const num = cnt + 1
        messages.view.blocks.splice(num , 0, {
            "type": "input",
            "element": {
                "type": "plain_text_input",
                "action_id": "plain_text_input-action",
                "initial_value": element.text.text
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
    const API_KEY = process.env.API_KEY
    const headers = {
        "content-type": "application/json",
        "Authorization": 'Bearer ' + API_KEY
    }
    
    // API CALL
    try { 
    
        const response = await axios.post(MODAL_API_ENDPOINT + "/views.push", messages, { headers: headers })
        console.log(response.data)
    
    } catch (error) { 
    
        console.log(error.response); 
    
    }

}