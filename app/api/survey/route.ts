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
    const surveyResponse = await request.json();
    const { participantId } = surveyResponse;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Missing participantId' },
        { status: 400 }
      );
    }

    const filePath = path.join(DATA_DIR, `${participantId}_survey.json`);

    // Write survey response to file
    fs.writeFileSync(filePath, JSON.stringify(surveyResponse, null, 2));

    return NextResponse.json({
      success: true,
      participantId,
    });
  } catch (error) {
    console.error('Error storing survey data:', error);
    return NextResponse.json(
      { error: 'Failed to store survey data' },
      { status: 500 }
    );
  }
}
