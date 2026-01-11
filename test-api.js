
const apiKey = '3c02542e-f327-4a84-8c12-0716c82ef867';
const baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

const candidates = [
    { id: 'doubao-seed-1-6-thinking-250715', endpoint: '/responses' }, // User provided
    { id: 'doubao-seed-1-6-thinking-250615', endpoint: '/responses' }, // Search result
    { id: 'doubao-seed-1-6-250615', endpoint: '/responses' }, // Search result non-thinking
    { id: 'doubao-seed-1-6-thinking-250715', endpoint: '/chat/completions' },
    { id: 'doubao-seed-1-6-thinking-250615', endpoint: '/chat/completions' },
];

async function testCandidate(candidate) {
    const url = baseUrl + candidate.endpoint;
    console.log(`Testing ${candidate.id} on ${candidate.endpoint}...`);
    
    let body;
    if (candidate.endpoint === '/responses') {
        body = {
            "model": candidate.id,
            "input": [
                {
                    "role": "user",
                    "content": [
                        { "type": "input_text", "text": "你好" }
                    ]
                }
            ]
        };
    } else {
        body = {
            "model": candidate.id,
            "messages": [
                { "role": "user", "content": "你好" }
            ]
        };
    }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        console.log(`Status:`, res.status);
        const text = await res.text();
        
        if (res.status === 200) {
            console.log(`SUCCESS! Found working config: Model=${candidate.id}, Endpoint=${candidate.endpoint}`);
            console.log('Response:', text);
            return true;
        } else {
            console.log(`Failed:`, text.substring(0, 150));
            return false;
        }
    } catch (err) {
        console.error(`Error:`, err.message);
        return false;
    }
}

async function runTests() {
    for (const candidate of candidates) {
        const success = await testCandidate(candidate);
        if (success) break;
    }
}

runTests();
