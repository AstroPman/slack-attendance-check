

const MODAL_API_ENDPOINT = 'https://slack.com/api'



exports.openModal = function (triggerId) {
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