/**
 * VocaFuse Node.js SDK - Quick Start Server
 * 
 * This example demonstrates a complete Node.js server setup with:
 * - VocaFuse client initialization
 * - Token generation endpoint for frontend authentication
 * - Webhook endpoint for receiving VocaFuse events
 * 
 * Prerequisites:
 *   npm install express body-parser
 * 
 * Usage:
 *   VOCAFUSE_API_KEY=sk_test_... VOCAFUSE_API_SECRET=secret_... WEBHOOK_SECRET=whsec_... node quickstart.js
 * 
 * Endpoints:
 *   POST /api/token - Generate JWT token for frontend clients
 *   POST /api/webhooks - Receive VocaFuse webhook events
 *   GET  /health - Health check endpoint
 */

const express = require('express');
const { Client, AccessToken, RequestValidator } = require('vocafuse-node');

const app = express();

// ============================================================================
// Configuration
// ============================================================================

const config = {
  apiKey: process.env.VOCAFUSE_API_KEY,
  apiSecret: process.env.VOCAFUSE_API_SECRET,
  webhookSecret: process.env.WEBHOOK_SECRET,
  port: process.env.PORT || 3000
};

// Validate required environment variables
if (!config.apiKey || !config.apiSecret) {
  console.error('Error: VOCAFUSE_API_KEY and VOCAFUSE_API_SECRET are required');
  process.exit(1);
}

if (!config.webhookSecret) {
  console.warn('Warning: WEBHOOK_SECRET not set. Webhook signature validation will fail.');
}

// ============================================================================
// Initialize VocaFuse Client
// ============================================================================

const client = new Client({
  apiKey: config.apiKey,
  apiSecret: config.apiSecret,
  retry: {
    maxRetries: 3,
    retryDelay: 1000
  }
});

const validator = new RequestValidator(config.webhookSecret);

// ============================================================================
// Token Generation Endpoint
// ============================================================================

/**
 * POST /api/token
 * 
 * Generate JWT token for frontend authentication.
 * 
 * Request body:
 *   {
 *     "userId": "user_123",           // Required: Your user identifier
 *     "expiresIn": 3600,              // Optional: Token expiration in seconds (default: 3600)
 *     "scopes": ["voicenotes:read"]   // Optional: Token scopes
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "jwt_token": "eyJhbGciOiJIUzI1NiIs...",
 *       "expires_in": 3600
 *     }
 *   }
 */
app.post('/api/token', express.json(), async (req, res) => {
  try {
    const { userId, expiresIn, scopes } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // In production, add authentication here to verify the request is from your app
    // Example: Check session, verify API key, validate JWT, etc.

    console.log(`Generating token for user: ${userId}`);

    // Generate token using AccessToken class
    const token = new AccessToken({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      identity: userId
    });

    const tokenResponse = await token.generate({
      expiresIn: expiresIn || 3600,
      scopes: scopes || ['voice-api.upload_voicenote']
    });

    return res.json({
      success: true,
      data: tokenResponse.data
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.friendlyMessage || 'Failed to generate token'
    });
  }
});

// ============================================================================
// Webhook Endpoint
// ============================================================================

/**
 * POST /api/webhooks
 * 
 * Receive and process VocaFuse webhook events.
 * 
 * Events:
 *   - voicenote.transcribed: Voice note successfully transcribed
 *   - voicenote.failed: Voice note processing failed
 *   - account.insufficient_balance: Account balance too low to process requests
 */
app.post('/api/webhooks',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      // Get raw payload as string for signature verification
      const payload = req.body.toString('utf8');
      
      // Get signature headers
      const signature = req.headers['x-vocafuse-signature'];
      const timestamp = req.headers['x-vocafuse-timestamp'];
      const deliveryId = req.headers['x-vocafuse-delivery-id'];

      // Validate signature
      if (!signature) {
        console.error('Missing webhook signature');
        return res.status(401).json({ error: 'Missing signature' });
      }

      const isValid = validator.validate(payload, signature, {
        timestamp,
        deliveryId
      });

      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse the validated payload
      const event = JSON.parse(payload);
      
      console.log(`Received webhook: ${event.event} (ID: ${deliveryId})`);

      // Handle different event types
      switch (event.event) {
        case 'voicenote.transcribed':
          await handleVoicenoteTranscribed(event.voicenote);
          break;

        case 'voicenote.failed':
          await handleVoicenoteFailed(event.voicenote, event.error);
          break;

        case 'account.insufficient_balance':
          await handleInsufficientBalance(event.account, event.trigger);
          break;

        default:
          console.log(`Unknown event type: ${event.event}`);
      }

      // Acknowledge receipt
      return res.json({ received: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      // Return 500 to trigger retry
      return res.status(500).json({ error: 'Processing failed' });
    }
  }
);

// ============================================================================
// Webhook Event Handlers
// ============================================================================

async function handleVoicenoteTranscribed(voicenote) {
  console.log(`✓ Voicenote transcribed: ${voicenote.id}`);
  console.log(`  User: ${voicenote.identity}`);
  console.log(`  Duration: ${voicenote.duration}s`);
  console.log(`  Text: ${voicenote.transcription.text.substring(0, 100)}...`);
  console.log(`  Language: ${voicenote.transcription.language}`);
  console.log(`  Confidence: ${voicenote.transcription.confidence}`);
  
  // Your business logic here:
  // - Save transcription to database
  // - Process/analyze the text
  // - Send notification to user
  // - Trigger downstream workflows
  // - Update user's voicenotes list
}

async function handleVoicenoteFailed(voicenote, error) {
  console.log(`✗ Voicenote failed: ${voicenote.id}`);
  console.log(`  User: ${voicenote.identity}`);
  console.log(`  Error code: ${error.code}`);
  console.log(`  Error message: ${error.message}`);
  
  // Your business logic here:
  // - Notify user of failure
  // - Log error for monitoring
  // - Provide user-friendly error message
  // - Implement retry logic if appropriate
}

async function handleInsufficientBalance(account, trigger) {
  console.log(`⚠️  Insufficient balance for ${trigger.operation}`);
  console.log(`  Tenant: ${account.tenant_id}`);
  console.log(`  Available balance: ${account.currency} ${account.available_balance}`);
  console.log(`  Estimated cost: ${account.currency} ${trigger.estimated_cost}`);
  console.log(`  Action required: ${trigger.action_required || 'Add credits to resume service'}`);
  
  // Your business logic here:
  // - Send alert to admin
  // - Notify user to add credits
  // - Pause or limit service
  // - Log for billing monitoring
}

// ============================================================================
// Additional API Endpoints (Examples)
// ============================================================================

/**
 * GET /api/voicenotes
 * 
 * List voicenotes for the authenticated user
 */
app.get('/api/voicenotes', express.json(), async (req, res) => {
  try {
    // In production, get userId from authenticated session
    const { userId, limit = 20, page = 0 } = req.query;

    const voicenotes = await client.voicenotes.list({
      limit: parseInt(limit),
      page: parseInt(page)
    });

    return res.json({
      success: true,
      data: voicenotes.data,
      pagination: voicenotes.pagination
    });

  } catch (error) {
    console.error('Error listing voicenotes:', error);
    return res.status(500).json({
      success: false,
      error: error.friendlyMessage || 'Failed to list voicenotes'
    });
  }
});

/**
 * GET /api/voicenotes/:id
 * 
 * Get a specific voicenote
 */
app.get('/api/voicenotes/:id', express.json(), async (req, res) => {
  try {
    const { id } = req.params;

    const voicenote = await client.voicenotes(id).get();

    return res.json({
      success: true,
      data: voicenote.data
    });

  } catch (error) {
    console.error(`Error getting voicenote ${req.params.id}:`, error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.friendlyMessage || 'Failed to get voicenote'
    });
  }
});

/**
 * GET /api/voicenotes/:id/transcription
 * 
 * Get transcription for a voicenote
 */
app.get('/api/voicenotes/:id/transcription', express.json(), async (req, res) => {
  try {
    const { id } = req.params;

    const transcription = await client.voicenotes(id).transcription.get();

    return res.json({
      success: true,
      data: transcription.data
    });

  } catch (error) {
    console.error(`Error getting transcription for ${req.params.id}:`, error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.friendlyMessage || 'Failed to get transcription'
    });
  }
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VocaFuse Quick Start Server',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Error Handling
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(config.port, async () => {
  console.log('\n🚀 VocaFuse Quick Start Server');
  console.log('================================\n');
  console.log(`Server running on: http://localhost:${config.port}`);
  console.log('\nEndpoints:');
  console.log(`  POST http://localhost:${config.port}/api/token`);
  console.log(`  POST http://localhost:${config.port}/api/webhooks`);
  console.log(`  GET  http://localhost:${config.port}/api/voicenotes`);
  console.log(`  GET  http://localhost:${config.port}/api/voicenotes/:id`);
  console.log(`  GET  http://localhost:${config.port}/api/voicenotes/:id/transcription`);
  console.log(`  GET  http://localhost:${config.port}/health`);
  console.log('\nWebhook URL for VocaFuse dashboard:');
  console.log(`  http://localhost:${config.port}/api/webhooks`);
  console.log('\n👉 In production, use a public URL (e.g., with ngrok for testing)');
  console.log('   ngrok http 3000');
  console.log('\n📝 Register webhook with events:');
  console.log('   - voicenote.transcribed');
  console.log('   - voicenote.failed');
  console.log('   - account.insufficient_balance\n');

  // Verify API connection
  try {
    const account = await client.account.get();
    console.log(`✓ Connected to VocaFuse API`);
    console.log(`  Account: ${account.data.name}`);
    console.log(`  Plan: ${account.data.plan}\n`);
  } catch (error) {
    console.error('✗ Failed to connect to VocaFuse API');
    console.error(`  ${error.friendlyMessage || error.message}\n`);
  }
});

// ============================================================================
// Webhook Registration Example
// ============================================================================

/**
 * Uncomment this section to automatically register your webhook on startup.
 * Make sure your server is publicly accessible (e.g., using ngrok).
 * 
 * Example:
 * 
 * async function registerWebhook() {
 *   try {
 *     const webhook = await client.webhooks.create({
 *       url: 'https://your-domain.com/api/webhooks',
 *       events: [
 *         'voicenote.transcribed',
 *         'voicenote.failed',
 *         'account.insufficient_balance'
 *       ],
 *       secret: config.webhookSecret
 *     });
 *     
 *     console.log(`✓ Webhook registered: ${webhook.data.id}`);
 *   } catch (error) {
 *     console.error('Failed to register webhook:', error.friendlyMessage);
 *   }
 * }
 * 
 * // Call after server starts
 * // registerWebhook();
 */
