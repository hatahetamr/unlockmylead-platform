const twilio = require('twilio');

class TwilioService {
  constructor() {
    // Initialize Twilio client with environment variables
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!this.accountSid || !this.authToken || !this.twilioPhoneNumber) {
      console.error('Missing Twilio credentials in environment variables');
      throw new Error('Twilio credentials not configured');
    }
    
    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Initiate an outbound call
   * @param {string} to - Phone number to call
   * @param {string} webhookUrl - URL for TwiML instructions
   * @param {object} campaignData - Campaign details to pass to webhook
   * @returns {Promise<object>} Call details
   */
  async initiateCall(to, webhookUrl, campaignData = {}) {
    try {
      const call = await this.client.calls.create({
        to: to,
        from: this.twilioPhoneNumber,
        url: webhookUrl,
        method: 'POST',
        statusCallback: `${webhookUrl}/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        // Pass campaign data as URL parameters
        url: `${webhookUrl}?campaignId=${campaignData.campaignId || ''}&leadId=${campaignData.leadId || ''}`
      });

      console.log(`Call initiated: ${call.sid} to ${to}`);
      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send an SMS message
   * @param {string} to - Phone number to send message to
   * @param {string} message - Message content
   * @returns {Promise<object>} Message details
   */
  async sendSMS(to, message) {
    try {
      const sms = await this.client.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: to
      });

      console.log(`SMS sent: ${sms.sid} to ${to}`);
      return {
        success: true,
        messageSid: sms.sid,
        status: sms.status,
        to: sms.to,
        from: sms.from
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate TwiML for voice response
   * @param {string} message - Text to speak
   * @param {string} voice - Voice to use (optional)
   * @param {string} language - Language code (optional)
   * @returns {string} TwiML XML
   */
  generateVoiceTwiML(message, voice = 'alice', language = 'en-US') {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.say({
      voice: voice,
      language: language
    }, message);
    
    return twiml.toString();
  }

  /**
   * Generate TwiML for gathering user input
   * @param {string} prompt - Prompt message
   * @param {string} actionUrl - URL to send gathered input
   * @param {object} options - Additional options
   * @returns {string} TwiML XML
   */
  generateGatherTwiML(prompt, actionUrl, options = {}) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    const gather = twiml.gather({
      action: actionUrl,
      method: 'POST',
      numDigits: options.numDigits || 1,
      timeout: options.timeout || 10,
      finishOnKey: options.finishOnKey || '#'
    });
    
    gather.say({
      voice: options.voice || 'alice',
      language: options.language || 'en-US'
    }, prompt);
    
    // Fallback if no input received
    twiml.say('Sorry, I didn\'t receive any input. Goodbye.');
    twiml.hangup();
    
    return twiml.toString();
  }

  /**
   * Generate TwiML to play audio from URL
   * @param {string} audioUrl - URL of audio file to play
   * @returns {string} TwiML XML
   */
  generatePlayAudioTwiML(audioUrl) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.play(audioUrl);
    
    return twiml.toString();
  }

  /**
   * Generate TwiML to record caller
   * @param {string} actionUrl - URL to send recording details
   * @param {object} options - Recording options
   * @returns {string} TwiML XML
   */
  generateRecordTwiML(actionUrl, options = {}) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.say('Please leave your message after the beep.');
    
    twiml.record({
      action: actionUrl,
      method: 'POST',
      maxLength: options.maxLength || 30,
      finishOnKey: options.finishOnKey || '#',
      recordingStatusCallback: options.statusCallback
    });
    
    twiml.say('Thank you for your message. Goodbye.');
    twiml.hangup();
    
    return twiml.toString();
  }

  /**
   * Get call details
   * @param {string} callSid - Call SID
   * @returns {Promise<object>} Call details
   */
  async getCallDetails(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        success: true,
        call: {
          sid: call.sid,
          status: call.status,
          duration: call.duration,
          startTime: call.startTime,
          endTime: call.endTime,
          to: call.to,
          from: call.from,
          price: call.price,
          priceUnit: call.priceUnit
        }
      };
    } catch (error) {
      console.error('Error fetching call details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get message details
   * @param {string} messageSid - Message SID
   * @returns {Promise<object>} Message details
   */
  async getMessageDetails(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        success: true,
        message: {
          sid: message.sid,
          status: message.status,
          body: message.body,
          to: message.to,
          from: message.from,
          dateCreated: message.dateCreated,
          dateSent: message.dateSent,
          price: message.price,
          priceUnit: message.priceUnit
        }
      };
    } catch (error) {
      console.error('Error fetching message details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TwilioService;