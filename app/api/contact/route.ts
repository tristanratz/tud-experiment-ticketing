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
    const { participantId, email } = body;

    if (!participantId || !email) {
      return NextResponse.json(
        { error: 'Missing participantId or email' },
        { status: 400 }
      );
    }

    const filePath = path.join(DATA_DIR, 'contacts.json');

    // Read existing contacts if file exists
    let existingContacts: any[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingContacts = JSON.parse(fileContent);
    }

    // Add new contact
    existingContacts.push({
      participantId,
      email,
      timestamp: Date.now(),
    });

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingContacts, null, 2));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error storing contact info:', error);
    return NextResponse.json(
      { error: 'Failed to store contact info' },
      { status: 500 }
    );
  }
}
