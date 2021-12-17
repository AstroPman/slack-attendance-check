const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.WEATHER_API_KEY
const API_ENDPOINT = "https://api.openweathermap.org/data/2.5/onecall"

const params = {
    lat: 35.621809241538855,
    lon: 139.73055964188674,
    exclude: "hourly",
    appid: API_KEY,
    lang: "ja",
    units: "metric"
}


module.exports = async function getWeatherData(){
    // API CALL
    console.log(params)
    try { 
        const response = await axios.get(API_ENDPOINT, { params : params})
        const todayWeather = response.data.daily[0]
        const maxTemp = todayWeather.temp.max
        const minTemp = todayWeather.temp.min
        const description = todayWeather.weather[0].description
        const weatherIcon = todayWeather.weather[0].icon
        const iconUrl = "http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png"
        return {
            maxTemp: maxTemp,
            minTemp: minTemp,
            description: description,
            iconUrl: iconUrl
        }
    } catch (error) { 
        console.log('error: ', error.response); 
        return {
            maxTemp: '- ',
            minTemp: '- ',
            description: 'UNAVAILABLE',
            iconUrl: 'https://picsum.photos/id/237/200/200'
        }
    } 
}
