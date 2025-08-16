const http = require('http');
const url = require('url');

// Mock data for voices (7 voice models as mentioned in the task)
const voices = [
    { id: 'voice1', name: 'Sarah', language: 'en-US', gender: 'female', accent: 'American' },
    { id: 'voice2', name: 'John', language: 'en-US', gender: 'male', accent: 'American' },
    { id: 'voice3', name: 'Emma', language: 'en-GB', gender: 'female', accent: 'British' },
    { id: 'voice4', name: 'James', language: 'en-GB', gender: 'male', accent: 'British' },
    { id: 'voice5', name: 'Maria', language: 'es-ES', gender: 'female', accent: 'Spanish' },
    { id: 'voice6', name: 'Pierre', language: 'fr-FR', gender: 'male', accent: 'French' },
    { id: 'voice7', name: 'Hans', language: 'de-DE', gender: 'male', accent: 'German' }
];

// Mock data for languages (40+ languages as mentioned in the task)
const languages = [
    { languageCode: 'en-US', languageName: 'English (US)' },
    { languageCode: 'en-GB', languageName: 'English (UK)' },
    { languageCode: 'es-ES', languageName: 'Spanish (Spain)' },
    { languageCode: 'es-MX', languageName: 'Spanish (Mexico)' },
    { languageCode: 'fr-FR', languageName: 'French (France)' },
    { languageCode: 'fr-CA', languageName: 'French (Canada)' },
    { languageCode: 'de-DE', languageName: 'German (Germany)' },
    { languageCode: 'it-IT', languageName: 'Italian (Italy)' },
    { languageCode: 'pt-BR', languageName: 'Portuguese (Brazil)' },
    { languageCode: 'pt-PT', languageName: 'Portuguese (Portugal)' },
    { languageCode: 'ru-RU', languageName: 'Russian (Russia)' },
    { languageCode: 'zh-CN', languageName: 'Chinese (Simplified)' },
    { languageCode: 'zh-TW', languageName: 'Chinese (Traditional)' },
    { languageCode: 'ja-JP', languageName: 'Japanese (Japan)' },
    { languageCode: 'ko-KR', languageName: 'Korean (South Korea)' },
    { languageCode: 'ar-SA', languageName: 'Arabic (Saudi Arabia)' },
    { languageCode: 'hi-IN', languageName: 'Hindi (India)' },
    { languageCode: 'th-TH', languageName: 'Thai (Thailand)' },
    { languageCode: 'vi-VN', languageName: 'Vietnamese (Vietnam)' },
    { languageCode: 'tr-TR', languageName: 'Turkish (Turkey)' },
    { languageCode: 'pl-PL', languageName: 'Polish (Poland)' },
    { languageCode: 'nl-NL', languageName: 'Dutch (Netherlands)' },
    { languageCode: 'sv-SE', languageName: 'Swedish (Sweden)' },
    { languageCode: 'da-DK', languageName: 'Danish (Denmark)' },
    { languageCode: 'no-NO', languageName: 'Norwegian (Norway)' },
    { languageCode: 'fi-FI', languageName: 'Finnish (Finland)' },
    { languageCode: 'cs-CZ', languageName: 'Czech (Czech Republic)' },
    { languageCode: 'sk-SK', languageName: 'Slovak (Slovakia)' },
    { languageCode: 'hu-HU', languageName: 'Hungarian (Hungary)' },
    { languageCode: 'ro-RO', languageName: 'Romanian (Romania)' },
    { languageCode: 'bg-BG', languageName: 'Bulgarian (Bulgaria)' },
    { languageCode: 'hr-HR', languageName: 'Croatian (Croatia)' },
    { languageCode: 'sr-RS', languageName: 'Serbian (Serbia)' },
    { languageCode: 'sl-SI', languageName: 'Slovenian (Slovenia)' },
    { languageCode: 'et-EE', languageName: 'Estonian (Estonia)' },
    { languageCode: 'lv-LV', languageName: 'Latvian (Latvia)' },
    { languageCode: 'lt-LT', languageName: 'Lithuanian (Lithuania)' },
    { languageCode: 'mt-MT', languageName: 'Maltese (Malta)' },
    { languageCode: 'el-GR', languageName: 'Greek (Greece)' },
    { languageCode: 'he-IL', languageName: 'Hebrew (Israel)' },
    { languageCode: 'fa-IR', languageName: 'Persian (Iran)' },
    { languageCode: 'ur-PK', languageName: 'Urdu (Pakistan)' },
    { languageCode: 'bn-BD', languageName: 'Bengali (Bangladesh)' },
    { languageCode: 'ta-IN', languageName: 'Tamil (India)' },
    { languageCode: 'te-IN', languageName: 'Telugu (India)' },
    { languageCode: 'ml-IN', languageName: 'Malayalam (India)' },
    { languageCode: 'kn-IN', languageName: 'Kannada (India)' },
    { languageCode: 'gu-IN', languageName: 'Gujarati (India)' },
    { languageCode: 'mr-IN', languageName: 'Marathi (India)' },
    { languageCode: 'pa-IN', languageName: 'Punjabi (India)' }
];

function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function sendJSON(res, statusCode, data) {
    setCORSHeaders(res);
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    console.log(`${method} ${path}`);

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
        setCORSHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    // Routes
    if (path === '/api/voices' && method === 'GET') {
        console.log('GET /api/voices - Returning all voice models');
        sendJSON(res, 200, {
            success: true,
            data: voices
        });
    }
    else if (path === '/api/languages' && method === 'GET') {
        console.log('GET /api/languages - Returning all languages');
        sendJSON(res, 200, {
            success: true,
            data: languages
        });
    }
    else if (path === '/api/voice-preview' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { text, voiceId, languageCode } = data;
                
                console.log('POST /api/voice-preview - Request data:', {
                    text,
                    voiceId,
                    languageCode
                });

                // Validate required fields
                if (!text || !voiceId) {
                    sendJSON(res, 400, {
                        success: false,
                        error: 'Missing required fields: text and voiceId'
                    });
                    return;
                }

                // Find the voice
                const voice = voices.find(v => v.id === voiceId);
                if (!voice) {
                    sendJSON(res, 404, {
                        success: false,
                        error: 'Voice not found'
                    });
                    return;
                }

                // Simulate voice preview generation
                const audioUrl = `https://example.com/audio/${voiceId}/${Date.now()}.mp3`;
                
                sendJSON(res, 200, {
                    success: true,
                    data: {
                        audioUrl,
                        voice: voice,
                        text: text,
                        duration: Math.floor(text.length / 10)
                    }
                });

            } catch (error) {
                console.error('Error parsing JSON:', error);
                sendJSON(res, 400, {
                    success: false,
                    error: 'Invalid JSON'
                });
            }
        });
    }
    else if (path === '/health' && method === 'GET') {
        sendJSON(res, 200, {
            status: 'OK',
            timestamp: new Date().toISOString(),
            port: 8080
        });
    }
    else {
        sendJSON(res, 404, {
            success: false,
            error: 'Endpoint not found'
        });
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`🚀 UnlockMyLead Backend Server running on port ${PORT}`);
    console.log(`📡 CORS enabled for: http://localhost:3000`);
    console.log(`🎵 Voice models available: ${voices.length}`);
    console.log(`🌍 Languages supported: ${languages.length}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /api/voices - Get all voice models`);
    console.log(`   GET  /api/languages - Get all supported languages`);
    console.log(`   POST /api/voice-preview - Generate voice preview`);
    console.log(`   GET  /health - Health check`);
});
