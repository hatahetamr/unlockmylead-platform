const express = require('express');
const router = express.Router();
const TwilioService = require('../services/twilioService');

// Initialize Twilio service
const twilioService = new TwilioService();

/**
 * POST /api/call/initiate
 * Initiate an outbound call
 */
router.post('/initiate', async (req, res) => {
  try {
    const { to, campaignId, leadId, scriptId } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Phone number (to) is required'
      });
    }

    // Construct webhook URL for TwiML instructions
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    const webhookUrl = `${baseUrl}/api/call/webhook`;
    
    const campaignData = {
      campaignId,
      leadId,
      scriptId
    };

    const result = await twilioService.initiateCall(to, webhookUrl, campaignData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Call initiated successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in call initiation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/call/webhook
 * Handle incoming call webhook from Twilio
 */
router.post('/webhook', async (req, res) => {
  try {
    const { CallSid, From, To, CallStatus } = req.body;
    const { campaignId, leadId, scriptId } = req.query;
    
    console.log(`Webhook received for call ${CallSid}: ${CallStatus}`);
    
    // TODO: Integrate with AI service to generate response
    // For now, return a simple greeting
    const greeting = 'Hello! Thank you for your interest. An AI agent will be with you shortly.';
    
    const twiml = twilioService.generateVoiceTwiML(greeting);
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error in webhook handler:', error);
    
    // Return error TwiML
    const errorTwiml = twilioService.generateVoiceTwiML('Sorry, there was an error. Please try again later.');
    res.type('text/xml');
    res.send(errorTwiml);
  }
});

/**
 * POST /api/call/webhook/status
 * Handle call status updates
 */
router.post('/webhook/status', async (req, res) => {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    
    console.log(`Call status update: ${CallSid} - ${CallStatus}`);
    
    // TODO: Update call status in database
    // TODO: Trigger any necessary follow-up actions
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in status webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * POST /api/call/gather
 * Handle user input gathering
 */
router.post('/gather', async (req, res) => {
  try {
    const { Digits, CallSid } = req.body;
    
    console.log(`User input received: ${Digits} for call ${CallSid}`);
    
    // TODO: Process user input with AI
    // TODO: Generate appropriate response
    
    let response;
    if (Digits === '1') {
      response = 'Thank you for your interest. Connecting you to our sales team.';
    } else if (Digits === '2') {
      response = 'Thank you. You will receive more information via email.';
    } else {
      response = 'Invalid selection. Please try again.';
    }
    
    const twiml = twilioService.generateVoiceTwiML(response);
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error in gather handler:', error);
    
    const errorTwiml = twilioService.generateVoiceTwiML('Sorry, there was an error processing your input.');
    res.type('text/xml');
    res.send(errorTwiml);
  }
});

/**
 * GET /api/call/:callSid
 * Get call details
 */
router.get('/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    
    const result = await twilioService.getCallDetails(callSid);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.call
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching call details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;