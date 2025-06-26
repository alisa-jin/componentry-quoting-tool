import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import csv from 'csv-parser'
import { get } from 'http';

dotenv.config();


const mpnPkg = []
fs.createReadStream('/Users/alisajin/Componentry/quotes/example_quote.csv')
.pipe(csv())
.on('data', async (row) => {
  let mpn = row['Quoted Part Number']
  const pkg = await getPackageDetails(mpn)
  mpnPkg.push(pkg)
})
.on('end', () => {
  console.log('CSV file successfully processed');
  console.log(mpnPkg)
});


async function getAccessToken() {
  const tokenUrl = 'https://api.digikey.com/v1/oauth2/token';
  const data = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  });

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    return {
      access: response.data.access_token,
      type: response.data.token_type,
      expires_in: 3600
    };
  } catch (error) {
    console.error('Error fetching access token:', error.response?.data || error.message);
    throw error;
  }
}

async function getProductDetails(partNumber, accessToken, clientId, useSandbox = true) {
  const baseUrl = useSandbox 
    ? 'https://sandbox-api.digikey.com' 
    : 'https://api.digikey.com';

  const endpoint = `/products/v4/search/${partNumber}/productdetails`;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-DIGIKEY-Client-Id': clientId,
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.status == 404) return ''
    else {
      console.error('DigiKey API getProductDetails error:', error.response?.data || error.message);
      throw error
    }

  }
}



function parsePackageCase(productDetails) {
    let parameterArray = productDetails?.Product.Parameters
    let packageObj = parameterArray.find((obj) => obj.ParameterText === 'Package / Case')
    if (!packageObj) {
      packageObj = parameterArray.find((obj) => obj.ParameterText == 'Mounting Type')
    }
    return packageObj?.ValueText
}

async function getPackageDetails(partNumber) {
  try {
    const token = await getAccessToken();
    const productDetails = await getProductDetails(partNumber, token.access, process.env.CLIENT_ID, false);
    if (!productDetails) console.log(productDetails)
    else console.log(parsePackageCase(productDetails))
  } catch (err) {
    console.error(`Error in getting package details for MPN ${partNumber}:`, err);
  }
}

