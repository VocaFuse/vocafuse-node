/**
 * VocaFuse Node.js SDK - Next.js API Route Example
 * 
 * This example demonstrates how to use the VocaFuse SDK in a Next.js API route.
 * 
 * File: pages/api/voicenotes.ts (or app/api/voicenotes/route.ts for App Router)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Client,
  VocaFuseError,
  AuthenticationError,
  RateLimitError,
  VoicenoteNotFoundError,
  Voicenote,
  PaginatedResponse
} from 'vocafuse';

// Initialize client (consider using a singleton pattern in production)
const client = new Client({
  apiKey: process.env.VOCAFUSE_API_KEY!,
  apiSecret: process.env.VOCAFUSE_API_SECRET!
});

type ResponseData =
  | PaginatedResponse<Voicenote>
  | { data: Voicenote }
  | { error: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id, status, limit, page } = req.query;

    // If ID is provided, get single voicenote
    if (id && typeof id === 'string') {
      const voicenote = await client.voicenotes.get(id);
      return res.status(200).json(voicenote);
    }

    // Otherwise, list voicenotes
    const voicenotes = await client.voicenotes.list({
      status: status as 'processing' | 'completed' | 'failed' | undefined,
      limit: limit ? parseInt(limit as string, 10) : 20,
      page: page ? parseInt(page as string, 10) : 0
    });

    return res.status(200).json(voicenotes);

  } catch (error) {
    return handleError(error, res);
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Voicenote ID is required' });
    }

    await client.voicenotes.delete(id);
    return res.status(204).end();

  } catch (error) {
    return handleError(error, res);
  }
}

function handleError(
  error: unknown,
  res: NextApiResponse<ResponseData>
) {
  if (error instanceof VoicenoteNotFoundError) {
    return res.status(404).json({
      error: error.message,
      code: error.errorCode
    });
  }

  if (error instanceof AuthenticationError) {
    // Log the error but don't expose details to client
    console.error('Authentication error:', error.friendlyMessage);
    return res.status(401).json({
      error: 'Authentication failed'
    });
  }

  if (error instanceof RateLimitError) {
    // Set retry-after header if available
    if (error.retryAfter) {
      res.setHeader('Retry-After', error.retryAfter.toString());
    }
    return res.status(429).json({
      error: 'Rate limit exceeded'
    });
  }

  if (error instanceof VocaFuseError) {
    return res.status(error.statusCode || 500).json({
      error: error.message,
      code: error.errorCode
    });
  }

  // Unknown error
  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'Internal server error'
  });
}

// ============================================================================
// App Router Version (Next.js 13+)
// File: app/api/voicenotes/route.ts
// ============================================================================

/*
import { NextRequest, NextResponse } from 'next/server';
import { Client, VocaFuseError } from 'vocafuse';

const client = new Client({
  apiKey: process.env.VOCAFUSE_API_KEY!,
  apiSecret: process.env.VOCAFUSE_API_SECRET!
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const voicenote = await client.voicenotes.get(id);
      return NextResponse.json(voicenote);
    }

    const voicenotes = await client.voicenotes.list({
      status: searchParams.get('status') as any,
      limit: parseInt(searchParams.get('limit') || '20', 10),
      page: parseInt(searchParams.get('page') || '0', 10)
    });

    return NextResponse.json(voicenotes);

  } catch (error) {
    if (error instanceof VocaFuseError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Voicenote ID is required' },
        { status: 400 }
      );
    }

    await client.voicenotes.delete(id);
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    if (error instanceof VocaFuseError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

