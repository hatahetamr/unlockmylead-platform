const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration to allow requests from frontend
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import route handlers
const hubspotRoutes = require('./routes/hubspot');
const apolloRoutes = require('./routes/apollo');
const crmRoutes = require('./routes/crm');

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

// API Routes

// Get all voices (canonical endpoint)
app.get('/api/voices', (req, res) => {
    try {
        console.log('GET /api/voices - Returning all voice models');
        res.json({
            success: true,
            data: voices
        });
    } catch (error) {
        console.error('Error fetching voices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch voices'
        });
    }
});

// Get all languages
app.get('/api/languages', (req, res) => {
    try {
        console.log('GET /api/languages - Returning all languages');
        res.json({
            success: true,
            data: languages
        });
    } catch (error) {
        console.error('Error fetching languages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch languages'
        });
    }
});

// Voice preview endpoint
app.post('/api/voice-preview', (req, res) => {
    try {
        const { text, voiceId, languageCode } = req.body;
        
        console.log('POST /api/voice-preview - Request data:', {
            text,
            voiceId,
            languageCode
        });

        // Validate required fields
        if (!text || !voiceId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: text and voiceId'
            });
        }

        // Find the voice
        const voice = voices.find(v => v.id === voiceId);
        if (!voice) {
            return res.status(404).json({
                success: false,
                error: 'Voice not found'
            });
        }

        // Simulate voice preview generation
        // In a real implementation, this would integrate with Google Cloud Text-to-Speech
        const audioUrl = `https://example.com/audio/${voiceId}/${Date.now()}.mp3`;
        
        res.json({
            success: true,
            data: {
                audioUrl,
                voice: voice,
                text: text,
                duration: Math.floor(text.length / 10) // Rough estimate
            }
        });

    } catch (error) {
        console.error('Error generating voice preview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate voice preview'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Use CRM and Lead Generation routes
app.use('/api/hubspot', hubspotRoutes);
app.use('/api/apollo', apolloRoutes);
app.use('/api/crm', crmRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
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

module.exports = app;