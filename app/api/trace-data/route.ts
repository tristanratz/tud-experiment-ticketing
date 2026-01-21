import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'collected');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, events } = body;

    if (!participantId || !events) {
      return NextResponse.json(
        { error: 'Missing participantId or events' },
        { status: 400 }
      );
    }

    const filePath = path.join(DATA_DIR, `${participantId}_trace.json`);

    // Read existing data if file exists
    let existingData: any[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
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
