const express = require('express');
const router = express.Router();
const TwilioService = require('../services/twilioService');

// Initialize Twilio service
const twilioService = new TwilioService();

/**
 * POST /api/message/send
 * Send an SMS message
 */
router.post('/send', async (req, res) => {
  try {
    const { to, message, campaignId, leadId } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number (to) and message are required'
      });
    }

    const result = await twilioService.sendSMS(to, message);
    
    if (result.success) {
      // TODO: Log message in database with campaign/lead info
      console.log(`SMS sent for campaign ${campaignId}, lead ${leadId}`);
      
      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/message/webhook
 * Handle incoming SMS webhook from Twilio
 */
router.post('/webhook', async (req, res) => {
  try {
    const { MessageSid, From, To, Body } = req.body;
    
    console.log(`Incoming SMS from ${From}: ${Body}`);
    
    // TODO: Process incoming message with AI
    // TODO: Generate appropriate response
    // TODO: Store conversation in database
    
    // For now, send a simple auto-reply
    const autoReply = "Thank you for your message. We'll get back to you soon!";
    
    const result = await twilioService.sendSMS(From, autoReply);
    
    if (result.success) {
      console.log(`Auto-reply sent to ${From}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in SMS webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * GET /api/message/:messageSid
 * Get message details
 */
router.get('/:messageSid', async (req, res) => {
  try {
    const { messageSid } = req.params;
    
    const result = await twilioService.getMessageDetails(messageSid);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.message
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching message details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/message/bulk-send
 * Send SMS to multiple recipients
 */
router.post('/bulk-send', async (req, res) => {
  try {
    const { recipients, message, campaignId } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || !message) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array and message are required'
      });
    }

    const results = [];
    const errors = [];

    // Send messages in parallel with rate limiting
    const batchSize = 10; // Process 10 at a time to avoid rate limits
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await twilioService.sendSMS(recipient.phone, message);
          
          if (result.success) {
            results.push({
              phone: recipient.phone,
              leadId: recipient.leadId,
              messageSid: result.messageSid,
              status: 'sent'
            });
          } else {
            errors.push({
              phone: recipient.phone,
              leadId: recipient.leadId,
              error: result.error
            });
          }
        } catch (error) {
          errors.push({
            phone: recipient.phone,
            leadId: recipient.leadId,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      message: `Bulk SMS campaign completed`,
      data: {
        campaignId,
        totalRecipients: recipients.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Error in bulk SMS send:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;