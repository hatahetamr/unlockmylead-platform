const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

class VoiceService {
  constructor() {
    this.client = new TextToSpeechClient();
    this.voiceCache = new Map();
    this.initializeVoices();
  }

  async initializeVoices() {
    try {
      const [voices] = await this.client.listVoices();
      this.availableVoices = this.categorizeVoices(voices.voices);
      console.log(`Loaded ${this.availableVoices.length} voices`);
    } catch (error) {
      console.error('Failed to initialize voices:', error);
    }
  }

  categorizeVoices(voices) {
    return voices.map(voice => ({
      id: voice.name,
      name: this.generateFriendlyName(voice),
      language: voice.languageCodes[0],
      gender: voice.ssmlGender,
      type: this.getVoiceType(voice.name),
      accent: this.getAccent(voice.languageCodes[0]),
      style: this.getStyle(voice.name),
      isPremium: voice.name.includes('WaveNet') || voice.name.includes('Neural2'),
      naturalSampleRateHertz: voice.naturalSampleRateHertz
    }));
  }

  generateFriendlyName(voice) {
    const language = voice.languageCodes[0];
    const type = this.getVoiceType(voice.name);
    const accent = this.getAccent(language);
    
    const names = {
      'en-US': { MALE: ['James', 'Michael', 'David', 'John'], FEMALE: ['Emma', 'Olivia', 'Sophia', 'Isabella'] },
      'es-ES': { MALE: ['Carlos', 'Miguel', 'Antonio', 'José'], FEMALE: ['María', 'Carmen', 'Isabel', 'Ana'] },
      'fr-FR': { MALE: ['Pierre', 'Jean', 'Michel', 'Philippe'], FEMALE: ['Marie', 'Sophie', 'Catherine', 'Isabelle'] },
      'de-DE': { MALE: ['Hans', 'Klaus', 'Wolfgang', 'Jürgen'], FEMALE: ['Greta', 'Ingrid', 'Helga', 'Ursula'] },
      'pt-BR': { MALE: ['João', 'Carlos', 'Antonio', 'José'], FEMALE: ['Maria', 'Ana', 'Carla', 'Lucia'] },
      'it-IT': { MALE: ['Marco', 'Giuseppe', 'Antonio', 'Francesco'], FEMALE: ['Giulia', 'Francesca', 'Chiara', 'Valentina'] }
    };

    const languageNames = names[language] || { MALE: ['Voice'], FEMALE: ['Voice'] };
    const nameList = languageNames[voice.ssmlGender] || ['Voice'];
    const randomName = nameList[Math.floor(Math.random() * nameList.length)];
    
    return `${randomName} (${accent} ${type})`;
  }

  getVoiceType(voiceName) {
    if (voiceName.includes('Neural2')) return 'Neural2';
    if (voiceName.includes('WaveNet')) return 'WaveNet';
    return 'Standard';
  }

  getAccent(languageCode) {
    const accents = {
      'en-US': 'US English',
      'en-GB': 'UK English',
      'en-AU': 'Australian English',
      'en-IN': 'Indian English',
      'es-ES': 'Spain Spanish',
      'es-MX': 'Mexico Spanish',
      'fr-FR': 'France French',
      'fr-CA': 'Canada French',
      'de-DE': 'German',
      'pt-BR': 'Brazilian Portuguese',
      'it-IT': 'Italian'
    };
    return accents[languageCode] || languageCode;
  }

  getStyle(voiceName) {
    if (voiceName.includes('Neural2')) return 'Professional';
    if (voiceName.includes('WaveNet')) return 'Conversational';
    return 'Standard';
  }

  async getVoicesByLanguage(language) {
    return this.availableVoices.filter(voice => 
      voice.language.startsWith(language)
    );
  }

  async getPremiumVoices() {
    return this.availableVoices.filter(voice => voice.isPremium);
  }

  async getPopularVoices() {
    const popularVoiceIds = [
      'en-US-Wavenet-D', 'en-US-Wavenet-F',
      'en-GB-Wavenet-A', 'en-GB-Wavenet-C',
      'es-ES-Wavenet-B', 'es-ES-Wavenet-C',
      'fr-FR-Wavenet-A', 'fr-FR-Wavenet-C',
      'de-DE-Wavenet-A', 'de-DE-Wavenet-C',
      'pt-BR-Wavenet-A', 'pt-BR-Wavenet-C',
      'it-IT-Wavenet-A', 'it-IT-Wavenet-C'
    ];
    
    return this.availableVoices.filter(voice => 
      popularVoiceIds.includes(voice.id)
    );
  }

  async generateVoicePreview(voiceId, text = null, language = 'en-US') {
    const cacheKey = `${voiceId}-${language}`;
    
    if (this.voiceCache.has(cacheKey)) {
      return this.voiceCache.get(cacheKey);
    }

    const previewTexts = {
      'en': 'Hello! This is a preview of my voice. I am excited to help you with your sales campaigns.',
      'es': 'Hola! Esta es una vista previa de mi voz. Estoy emocionado de ayudarte con tus campañas de ventas.',
      'fr': 'Bonjour! Ceci est un aperçu de ma voix. Je suis ravi de vous aider avec vos campagnes de vente.',
      'de': 'Hallo! Das ist eine Vorschau meiner Stimme. Ich freue mich darauf, Ihnen bei Ihren Verkaufskampagnen zu helfen.',
      'pt': 'Olá! Esta é uma prévia da minha voz. Estou animado para ajudá-lo com suas campanhas de vendas.',
      'it': 'Ciao! Questa è una anteprima della mia voce. Sono entusiasta di aiutarti con le tue campagne di vendita.'
    };

    const languagePrefix = language.split('-')[0];
    const previewText = text || previewTexts[languagePrefix] || previewTexts['en'];

    try {
      const request = {
        input: { text: previewText },
        voice: { 
          name: voiceId,
          languageCode: language
        },
        audioConfig: { 
          audioEncoding: 'MP3',
          sampleRateHertz: 24000
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      const audioBuffer = response.audioContent;
      
      this.voiceCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to generate voice preview:', error);
      throw new Error('Voice preview generation failed');
    }
  }

  getAllVoices() {
    return this.availableVoices || [];
  }

  getVoiceById(voiceId) {
    return this.availableVoices.find(voice => voice.id === voiceId);
  }

  searchVoices(query) {
    const searchTerm = query.toLowerCase();
    return this.availableVoices.filter(voice => 
      voice.name.toLowerCase().includes(searchTerm) ||
      voice.language.toLowerCase().includes(searchTerm) ||
      voice.accent.toLowerCase().includes(searchTerm) ||
      voice.style.toLowerCase().includes(searchTerm)
    );
  }
}

module.exports = new VoiceService();