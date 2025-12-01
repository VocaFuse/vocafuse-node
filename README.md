# VocaFuse Node.js SDK

A Node.js SDK for communicating with the VocaFuse API and building voice-enabled applications.

[![npm version](https://badge.fury.io/js/vocafuse-node.svg)](https://www.npmjs.com/package/vocafuse-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vocafuse/vocafuse-node/blob/main/LICENSE)

## Features

- ✅ **Full TypeScript Support** - Complete type definitions with IntelliSense
- ✅ **Dual Module Support** - CommonJS and ES Modules
- ✅ **Promise-Based API** - Modern async/await patterns
- ✅ **Async Iterators** - Automatic pagination with `for await...of`
- ✅ **Auto Environment Detection** - Automatic API endpoint selection based on key prefix
- ✅ **Rich Error Context** - Actionable error messages with resource IDs and suggestions
- ✅ **Automatic Retries** - Exponential backoff for transient failures
- ✅ **Browser Compatible** - Works in Node.js and browsers
- ✅ **Zero Config** - Sensible defaults with full customization
- ✅ **Webhook Verification** - Built-in signature validation
- ✅ **JWT Token Generation** - Frontend authentication support

## Installation

```bash
npm install vocafuse-node
```

or with yarn:

```bash
yarn add vocafuse-node
```

## Quick Start

```typescript
import { Client } from 'vocafuse-node';

const client = new Client({
  apiKey: process.env.VOCAFUSE_API_KEY!,
  apiSecret: process.env.VOCAFUSE_API_SECRET!
});

// List voicenotes
const voicenotes = await client.voicenotes.list({ limit: 10 });
console.log(`Found ${voicenotes.data.length} voicenotes`);

// Get a specific voicenote
const voicenote = await client.voicenotes('vn_123').get();
console.log(`Status: ${voicenote.data.status}`);

// Get transcription
const transcription = await client.voicenotes('vn_123').transcription.get();
console.log(`Text: ${transcription.data.text}`);

// Delete a voicenote
await client.voicenotes('vn_123').delete();
```

## Usage

### Client Initialization

```typescript
import { Client } from 'vocafuse-node';

// Basic initialization (environment auto-detected from API key prefix)
const client = new Client({
  apiKey: process.env.VOCAFUSE_API_KEY!,
  apiSecret: process.env.VOCAFUSE_API_SECRET!
});

// With custom options
const client = new Client({
  apiKey: 'sk_test_...',
  apiSecret: 'secret_...',
  timeout: 60000,
  retry: {
    maxRetries: 5,
    retryDelay: 2000
  }
});
```

### Voicenotes

```typescript
// List voicenotes with filters
const voicenotes = await client.voicenotes.list({
  status: 'transcribed',
  limit: 20,
  dateFrom: '2024-01-01'
});

// Get a specific voicenote
const voicenote = await client.voicenotes('vn_123').get();

// Delete a voicenote
await client.voicenotes('vn_123').delete();

// Get transcription (nested resource access)
const transcription = await client.voicenotes('vn_123').transcription.get();
console.log(transcription.data.text);
```

### Automatic Pagination with Async Iterators

```typescript
// Iterate over ALL voicenotes - pagination handled automatically
for await (const voicenote of client.voicenotes.iterate({ status: 'transcribed' })) {
  console.log(`Processing: ${voicenote.id}`);
}

// Collect all voicenotes into an array
const allVoicenotes = [];
for await (const voicenote of client.voicenotes.iterate()) {
  allVoicenotes.push(voicenote);
}

// Early exit stops fetching more pages
for await (const voicenote of client.voicenotes.iterate()) {
  if (voicenote.status === 'failed') {
    console.log('Found failed voicenote:', voicenote.id);
    break;
  }
}
```

### Webhooks

```typescript
// Create a webhook
const webhook = await client.webhooks.create({
  url: 'https://myapp.com/webhooks',
  events: ['voicenote.transcribed', 'voicenote.failed'],
  secret: 'my-webhook-secret'
});

// List webhooks
const webhooks = await client.webhooks.list();

// Update a webhook
await client.webhooks('wh_123').update({
  url: 'https://myapp.com/new-endpoint',
  events: ['voicenote.transcribed']
});

// Delete a webhook
await client.webhooks('wh_123').delete();
```

### Webhook Signature Verification

```typescript
import { RequestValidator } from 'vocafuse-node';

const validator = new RequestValidator(process.env.WEBHOOK_SECRET!);

// In your webhook handler
app.post('/webhooks/vocafuse', express.raw({ type: 'application/json' }), (req, res) => {
  const payload = req.body.toString('utf8');
  const signature = req.headers['x-vocafuse-signature'];

  if (!validator.validate(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  // Process webhook...
  
  res.json({ received: true });
});
```

### JWT Token Generation

```typescript
import { AccessToken } from 'vocafuse-node';

const token = new AccessToken({
  apiKey: process.env.VOCAFUSE_API_KEY!,
  apiSecret: process.env.VOCAFUSE_API_SECRET!,
  identity: 'user_123'
});

// Generate token with default options
const response = await token.generate();
console.log(`Token: ${response.data.jwt_token}`);

// Generate with custom options
const customResponse = await token.generate({
  expiresIn: 3600,
  scopes: ['voicenotes:read', 'voicenotes:write']
});
```

### API Keys

```typescript
// List API keys
const keys = await client.apiKeys.list();

// Create a new API key
const newKey = await client.apiKeys.create({ name: 'Production Key' });
// Save the secret! It's only shown once
console.log(`Key: ${newKey.data.api_key}, Secret: ${newKey.data.api_secret}`);

// Delete an API key
await client.apiKeys('ak_123').delete();
```

### Account

```typescript
// Get account information
const account = await client.account.get();
console.log(`Plan: ${account.data.plan}`);
console.log(`Voicenotes: ${account.data.usage?.voicenotes_count}`);

// Update account settings
await client.account.update({
  name: 'My Company',
  settings: { default_language: 'en-US' }
});
```

## Error Handling

The SDK provides rich, typed errors with context and suggestions:

```typescript
import {
  VocaFuseError,
  VoicenoteNotFoundError,
  AuthenticationError,
  RateLimitError
} from 'vocafuse-node';

try {
  const voicenote = await client.voicenotes('vn_invalid').get();
} catch (error) {
  if (error instanceof VoicenoteNotFoundError) {
    console.error('Error:', error.message);
    // "Voicenote not found"
    
    console.error('Friendly:', error.friendlyMessage);
    // "Voicenote not found (voicenote: vn_invalid). Verify the voicenote ID exists..."
    
    console.error('Resource ID:', error.context?.resourceId);
    // "vn_invalid"
    
  } else if (error instanceof RateLimitError) {
    if (error.retryAfter) {
      await new Promise(r => setTimeout(r, error.retryAfter! * 1000));
    }
    
  } else if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.friendlyMessage);
    
  } else if (error instanceof VocaFuseError) {
    console.error('API error:', error.friendlyMessage);
  }
}
```

### Error Types

| Error | Status Code | Description |
|-------|-------------|-------------|
| `AuthenticationError` | 401 | Invalid API credentials |
| `AuthorizationError` | 403 | Insufficient permissions |
| `ValidationError` | 400 | Invalid request parameters |
| `NotFoundError` | 404 | Resource not found |
| `VoicenoteNotFoundError` | 404 | Voicenote not found |
| `WebhookNotFoundError` | 404 | Webhook not found |
| `TranscriptionNotFoundError` | 404 | Transcription not found |
| `APIKeyNotFoundError` | 404 | API key not found |
| `ConflictError` | 409 | Resource conflict |
| `RateLimitError` | 429 | Rate limit exceeded |
| `ServerError` | 5xx | Server-side error |

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Voicenote,
  VoicenoteStatus,
  Transcription,
  Webhook,
  WebhookEvent,
  APIKey,
  Account,
  ApiResponse,
  PaginatedResponse
} from 'vocafuse-node';
```

## Retry Configuration

The SDK automatically retries failed requests with exponential backoff:

```typescript
const client = new Client({
  apiKey: '...',
  apiSecret: '...',
  retry: {
    maxRetries: 3,          // Maximum retry attempts
    retryDelay: 1000,       // Base delay in ms
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
});
```

## Requirements

- Node.js 16+
- TypeScript 4.7+ (for TypeScript users)

## License

MIT License - see [LICENSE](https://github.com/vocafuse/vocafuse-node/blob/main/LICENSE) for details.

## Support

- [Documentation](https://docs.vocafuse.com)
- [GitHub Issues](https://github.com/vocafuse/vocafuse-node/issues)
- [API Reference](https://docs.vocafuse.com/api)
