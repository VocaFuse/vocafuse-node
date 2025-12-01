/**
 * VocaFuse Node.js SDK - Express Webhook Handler Example
 * 
 * This example demonstrates how to set up a webhook endpoint
 * with Express to receive and verify VocaFuse webhook events.
 * 
 * Usage:
 *   npm install express
 *   VOCAFUSE_API_KEY=... VOCAFUSE_API_SECRET=... WEBHOOK_SECRET=... node express-webhook.js
 */

const express = require('express');
const { Client, RequestValidator } = require('vocafuse');

const app = express();

// Initialize VocaFuse client
const client = new Client({
  apiKey: process.env.VOCAFUSE_API_KEY,
  apiSecret: process.env.VOCAFUSE_API_SECRET
});

// Initialize webhook validator
// Use RequestValidator for webhook signature verification
// This is separate from WebhooksResource which handles CRUD operations
const validator = new RequestValidator(process.env.WEBHOOK_SECRET);

/**
 * Webhook endpoint
 * 
 * Important: Use express.raw() to get the raw body for signature verification.
 * The signature is computed over the raw request body, so parsing it as JSON
 * first would invalidate the signature.
 */
app.post('/webhooks/vocafuse',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // Get raw payload as string
    const payload = req.body.toString('utf8');
    
    // Get signature headers
    const signature = req.headers['x-vocafuse-signature'];
    const timestamp = req.headers['x-vocafuse-timestamp'];
    const deliveryId = req.headers['x-vocafuse-delivery-id'];

    // Validate signature
    if (!signature) {
      console.error('Missing signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Validate with timestamp for enhanced security
    const isValid = validator.validate(payload, signature, {
      timestamp,
      deliveryId
    });

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse the validated payload
    let event;
    try {
      event = JSON.parse(payload);
    } catch (error) {
      console.error('Invalid JSON payload');
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.log(`Received webhook: ${event.event}`);
    console.log(`Delivery ID: ${deliveryId}`);

    // Handle different event types
    try {
      switch (event.event) {
        case 'voicenote.created':
          await handleVoicenoteCreated(event.data);
          break;

        case 'voicenote.completed':
          await handleVoicenoteCompleted(event.data);
          break;

        case 'voicenote.failed':
          await handleVoicenoteFailed(event.data);
          break;

        case 'voicenote.deleted':
          await handleVoicenoteDeleted(event.data);
          break;

        default:
          console.log(`Unknown event type: ${event.event}`);
      }

      // Acknowledge receipt
      res.json({ received: true });

    } catch (error) {
      console.error('Error processing webhook:', error);
      // Return 500 to trigger retry
      res.status(500).json({ error: 'Processing failed' });
    }
  }
);

// Event handlers

async function handleVoicenoteCreated(data) {
  console.log(`Voicenote created: ${data.id}`);
  // Store the voicenote ID, notify user, etc.
}

async function handleVoicenoteCompleted(data) {
  console.log(`Voicenote completed: ${data.id}`);
  
  // Fetch the transcription using the callable pattern
  try {
    const transcription = await client.voicenotes(data.id).transcription.get();
    console.log(`Transcription: ${transcription.data.text.substring(0, 100)}...`);
    console.log(`Language: ${transcription.data.language}`);
    console.log(`Confidence: ${transcription.data.confidence}`);
    
    // Store transcription, send notification, etc.
  } catch (error) {
    console.error(`Failed to fetch transcription: ${error.message}`);
  }
}

async function handleVoicenoteFailed(data) {
  console.log(`Voicenote failed: ${data.id}`);
  console.log(`Error: ${data.error || 'Unknown error'}`);
  // Notify user of failure, retry, etc.
}

async function handleVoicenoteDeleted(data) {
  console.log(`Voicenote deleted: ${data.id}`);
  // Clean up related data, etc.
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/vocafuse`);
});

