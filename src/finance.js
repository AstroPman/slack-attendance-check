
const axios = require('axios');
require('dotenv').config();

const functions = require('./functions.js');

const API_KEY = process.env.FINANCE_API_KEY
const API_ENDPOINT = 'https://www.alphavantage.co/query'

const params = {
    function: "TIME_SERIES_DAILY_ADJUSTED",
    symbol: "KD",
    apikey: API_KEY
}

const headers = {
    'User-Agent': 'request'
}

module.exports = async function getFinanceData(){
    const date  = new Date();
    let year  = date.getFullYear();
    let month = date.getMonth() + 1;
    let day   = date.getDate();
    const today = year + '-' + month + '-' + day;
    date.setDate(date.getDate() - 1);
    year  = date.getFullYear();
    month = date.getMonth() + 1;
    day   = date.getDate();
    const yesterday = year + '-' + month + '-' + day;
    
    
    // API CALL
    try { 
        const response = await axios.get(API_ENDPOINT, { headers: headers, params : params})
        const dailyData = response.data['Time Series (Daily)']
        latestData = response.data['Time Series (Daily)'][Object.keys(dailyData)[0]]
        secondLatestData = response.data['Time Series (Daily)'][Object.keys(dailyData)[1]]
        console.log('latestData: ', latestData)
        console.log('latestData: ', secondLatestData)

        const diff = Number(latestData['4. close']) - Number(secondLatestData['4. close'])
        if (diff > 0) {
            result = 'arrow_up'
        }
        else if (diff == 0) {
            result ='arrow_right'
        }
        else {
            result ='arrow_down'
        }

        return [latestData['4. close'], diff.toFixed(2),result]

    } catch (error) { 
        console.log('getFinanceData error: ', error.response); 
        return ['No data', '-','kyndryl-logo']
    } 
}

