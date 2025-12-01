/**
 * VocaFuse Node.js SDK - Complete Usage Example
 * 
 * This example demonstrates comprehensive usage of the VocaFuse SDK
 * including all resources, error handling, and async iteration.
 * 
 * Usage:
 *   npx ts-node complete-usage.ts
 */

import {
  Client,
  AccessToken,
  RequestValidator,
  VocaFuseError,
  VoicenoteNotFoundError,
  AuthenticationError,
  RateLimitError,
  Voicenote,
  Transcription
} from 'vocafuse-node';

// Initialize client
const client = new Client({
  apiKey: process.env.VOCAFUSE_API_KEY!,
  apiSecret: process.env.VOCAFUSE_API_SECRET!,
  retry: {
    maxRetries: 3,
    retryDelay: 1000
  }
});

// ============================================================================
// Voicenotes Examples
// ============================================================================

async function voicenotesExamples(): Promise<void> {
  console.log('\n=== Voicenotes ===\n');

  // List voicenotes with pagination
  console.log('Listing voicenotes...');
  const voicenotes = await client.voicenotes.list({
    status: 'transcribed',
    limit: 10,
    page: 0
  });
  console.log(`Found ${voicenotes.data.length} voicenotes`);
  console.log(`Has more: ${voicenotes.pagination?.has_more}`);

  // Get a specific voicenote
  if (voicenotes.data.length > 0) {
    const id = voicenotes.data[0].id;
    console.log(`\nGetting voicenote ${id}...`);
    const voicenote = await client.voicenotes(id).get();
    console.log(`Status: ${voicenote.data.status}`);
    console.log(`Duration: ${voicenote.data.duration}s`);

    // Get transcription using callable pattern
    console.log('\nGetting transcription...');
    try {
      const transcription = await client.voicenotes(id).transcription.get();
      console.log(`Text: ${transcription.data.text.substring(0, 100)}...`);
      console.log(`Confidence: ${transcription.data.confidence}`);
      console.log(`Language: ${transcription.data.language}`);
    } catch (error) {
      if (error instanceof VoicenoteNotFoundError) {
        console.log('Transcription not available yet');
      } else {
        throw error;
      }
    }
  }

  // Async iteration - automatic pagination
  console.log('\nIterating over all transcribed voicenotes...');
  let count = 0;
  for await (const voicenote of client.voicenotes.iterate({ status: 'transcribed' })) {
    console.log(`  ${voicenote.id}: ${voicenote.status}`);
    count++;
    if (count >= 5) {
      console.log('  (stopping early for demo)');
      break;
    }
  }
}

// ============================================================================
// Webhooks Examples
// ============================================================================

async function webhooksExamples(): Promise<void> {
  console.log('\n=== Webhooks ===\n');

  // List webhooks
  console.log('Listing webhooks...');
  const webhooks = await client.webhooks.list();
  console.log(`Found ${webhooks.data.length} webhooks`);

  // Create a webhook
  console.log('\nCreating webhook...');
  const webhook = await client.webhooks.create({
    url: 'https://example.com/webhooks/vocafuse',
    events: ['voicenote.transcribed', 'voicenote.failed'],
    secret: 'my-webhook-secret'
  });
  console.log(`Created webhook: ${webhook.data.id}`);
  console.log(`URL: ${webhook.data.url}`);
  console.log(`Events: ${webhook.data.events.join(', ')}`);

  // Update webhook using callable pattern
  console.log('\nUpdating webhook...');
  const updated = await client.webhooks(webhook.data.id).update({
    url: 'https://example.com/webhooks/vocafuse-v2',
    events: ['voicenote.transcribed']
  });
  console.log(`Updated URL: ${updated.data.url}`);

  // Delete webhook using callable pattern
  console.log('\nDeleting webhook...');
  await client.webhooks(webhook.data.id).delete();
  console.log('Webhook deleted');
}

// ============================================================================
// Webhook Verification Example
// ============================================================================

function webhookVerificationExample(): void {
  console.log('\n=== Webhook Verification ===\n');

  const secret = 'my-webhook-secret';
  const validator = new RequestValidator(secret);

  // Simulate incoming webhook
  const payload = JSON.stringify({
    event: 'voicenote.transcribed',
    data: { id: 'vn_123', status: 'transcribed' }
  });

  // Compute signature (simulating what VocaFuse would send)
  const signature = validator.computeSignature(payload);
  console.log(`Payload: ${payload}`);
  console.log(`Signature: sha256=${signature}`);

  // Verify signature
  const isValid = validator.validate(payload, `sha256=${signature}`);
  console.log(`\nSignature valid: ${isValid}`);

  // Invalid signature test
  const invalidResult = validator.validate(payload, 'sha256=invalid');
  console.log(`Invalid signature rejected: ${!invalidResult}`);
}

// ============================================================================
// JWT Token Generation Example
// ============================================================================

async function jwtTokenExample(): Promise<void> {
  console.log('\n=== JWT Token Generation ===\n');

  const token = new AccessToken({
    apiKey: process.env.VOCAFUSE_API_KEY!,
    apiSecret: process.env.VOCAFUSE_API_SECRET!,
    identity: 'user_12345'
  });

  // Generate with default options
  console.log('Generating token with defaults...');
  const response = await token.generate();
  console.log(`Token: ${response.data.jwt_token.substring(0, 50)}...`);
  console.log(`Type: ${response.data.token_type}`);
  console.log(`Expires in: ${response.data.expires_in}s`);

  // Generate with custom options
  console.log('\nGenerating token with custom options...');
  const customResponse = await token.generate({
    expiresIn: 7200,
    scopes: ['voicenotes:read', 'voicenotes:write']
  });
  console.log(`Custom token expires in: ${customResponse.data.expires_in}s`);
}

// ============================================================================
// API Keys Examples
// ============================================================================

async function apiKeysExamples(): Promise<void> {
  console.log('\n=== API Keys ===\n');

  // List API keys
  console.log('Listing API keys...');
  const keys = await client.apiKeys.list();
  console.log(`Found ${keys.data.length} API keys`);

  // Create a new API key
  console.log('\nCreating API key...');
  const newKey = await client.apiKeys.create({ name: 'Test Key' });
  console.log(`Created key: ${newKey.data.id}`);
  console.log(`Name: ${newKey.data.name}`);
  console.log(`Key: ${newKey.data.api_key}`);
  console.log(`Secret: ${newKey.data.api_secret} (only shown once!)`);

  // Delete the key using callable pattern
  console.log('\nDeleting API key...');
  await client.apiKeys(newKey.data.id).delete();
  console.log('API key deleted');
}

// ============================================================================
// Account Examples
// ============================================================================

async function accountExamples(): Promise<void> {
  console.log('\n=== Account ===\n');

  // Get account info
  console.log('Getting account info...');
  const account = await client.account.get();
  console.log(`ID: ${account.data.id}`);
  console.log(`Name: ${account.data.name}`);
  console.log(`Email: ${account.data.email}`);
  console.log(`Plan: ${account.data.plan}`);

  if (account.data.usage) {
    console.log(`\nUsage:`);
    console.log(`  Voicenotes: ${account.data.usage.voicenotes_count}`);
    console.log(`  Total duration: ${account.data.usage.total_duration}s`);
    console.log(`  API calls: ${account.data.usage.api_calls_count}`);
  }

  // Update account
  console.log('\nUpdating account...');
  const updated = await client.account.update({
    settings: {
      default_language: 'en-US',
      notifications_enabled: true
    }
  });
  console.log(`Updated settings: ${JSON.stringify(updated.data.settings)}`);
}

// ============================================================================
// Error Handling Examples
// ============================================================================

async function errorHandlingExamples(): Promise<void> {
  console.log('\n=== Error Handling ===\n');

  // Try to get a non-existent voicenote
  try {
    await client.voicenotes('vn_nonexistent').get();
  } catch (error) {
    if (error instanceof VoicenoteNotFoundError) {
      console.log('VoicenoteNotFoundError caught:');
      console.log(`  Message: ${error.message}`);
      console.log(`  Friendly: ${error.friendlyMessage}`);
      console.log(`  Resource ID: ${error.context?.resourceId}`);
      console.log(`  Suggestion: ${error.context?.suggestion}`);
    }
  }

  // Demonstrate error JSON serialization
  try {
    await client.voicenotes('vn_invalid').get();
  } catch (error) {
    if (error instanceof VocaFuseError) {
      console.log('\nError as JSON:');
      console.log(JSON.stringify(error.toJSON(), null, 2));
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('VocaFuse SDK - Complete Usage Example');
  console.log('=====================================');

  try {
    await voicenotesExamples();
    await webhooksExamples();
    webhookVerificationExample();
    await jwtTokenExample();
    await apiKeysExamples();
    await accountExamples();
    await errorHandlingExamples();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('\n❌ Authentication failed:', error.friendlyMessage);
      console.error('   Make sure VOCAFUSE_API_KEY and VOCAFUSE_API_SECRET are set');
    } else if (error instanceof RateLimitError) {
      console.error('\n❌ Rate limit exceeded:', error.friendlyMessage);
      if (error.retryAfter) {
        console.error(`   Retry after: ${error.retryAfter}s`);
      }
    } else if (error instanceof VocaFuseError) {
      console.error('\n❌ API Error:', error.friendlyMessage);
    } else {
      throw error;
    }
    process.exit(1);
  }
}

main();
