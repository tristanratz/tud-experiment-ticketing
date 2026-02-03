import { NextRequest, NextResponse } from 'next/server';
import { TraceEvent } from '@/types';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'tud-experiment', 'collected')
  : path.join(process.cwd(), 'data', 'collected');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { participantId?: string; events?: TraceEvent[] };
    const { participantId, events } = body;

    if (!participantId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing participantId or events' },
        { status: 400 }
      );
    }

    const filePath = path.join(DATA_DIR, `${participantId}_trace.json`);

    // Read existing data if file exists
    let existingData: TraceEvent[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent) as unknown;
      if (Array.isArray(parsed)) {
        existingData = parsed as TraceEvent[];
      }
    }

    // Append new events
    const updatedData = [...existingData, ...events];

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

    return NextResponse.json({
      success: true,
      eventsStored: events.length,
    });
  } catch (error) {
    console.error('Error storing trace data:', error);
    return NextResponse.json(
      { error: 'Failed to store trace data' },
      { status: 500 }
    );
  }
}
