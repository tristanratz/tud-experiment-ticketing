import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import surveyConfig from '@/data/survey.json';

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
    const surveyResponse = await request.json();
    const { participantId } = surveyResponse;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Missing participantId' },
        { status: 400 }
      );
    }

    const questions = surveyConfig.questions as Array<{
      id: string;
      type: 'likert' | 'text';
      required?: boolean;
    }>;

    const missingFields = questions
      .filter((question) => question.required)
      .filter((question) => {
        const value = surveyResponse[question.id];
        if (question.type === 'likert') {
          return typeof value !== 'number';
        }
        return !value || !String(value).trim();
      })
      .map((question) => question.id);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
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
