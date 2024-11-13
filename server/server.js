const axios = require('axios');
require('dotenv').config();

async function getAccessToken() {
    const tokenUrl = 'https://api.digikey.com/v1/oauth2/token';
    const data = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
    }).toString();

    try {
        const response = await axios.post(tokenUrl, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        
        // Access token
        console.log("Data:", response.data)
        const accessToken = response.data.access_token;
        console.log("Access Token:", accessToken);
        return accessToken;
    } catch (error) {
        console.error('Error fetching access token:', error.response?.data || error.message);
    }
}

getAccessToken();
