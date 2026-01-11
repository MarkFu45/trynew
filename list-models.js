
import fetch from 'node-fetch';

const apiKey = '3c02542e-f327-4a84-8c12-0716c82ef867';
const url = 'https://ark.cn-beijing.volces.com/api/v3/endpoints'; 

console.log('Fetching endpoints...');

fetch(url, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`
    }
})
.then(async res => {
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
})
.catch(err => console.error('Error:', err));
