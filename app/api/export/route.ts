import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ticketService } from '@/lib/tickets';

const DATA_DIR = path.join(process.cwd(), 'data', 'collected');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json'; // json or csv
    const adminKey = searchParams.get('key');

    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      return NextResponse.json(
        { error: 'No data collected yet' },
        { status: 404 }
      );
    }

    const files = fs.readdirSync(DATA_DIR);
    const participants: any[] = [];

    // Group files by participant
    const participantMap: Map<string, any> = new Map();

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (file.endsWith('_trace.json')) {
        const participantId = file.replace('_trace.json', '');
        if (!participantMap.has(participantId)) {
          participantMap.set(participantId, { participantId });
        }
        participantMap.get(participantId).traceEvents = data;
      } else if (file.endsWith('_survey.json')) {
        const participantId = file.replace('_survey.json', '');
        if (!participantMap.has(participantId)) {
          participantMap.set(participantId, { participantId });
        }
        participantMap.get(participantId).survey = data;
      }
    }

    // Convert map to array and calculate metrics
    participantMap.forEach((participantData) => {
      const { traceEvents = [], survey = {} } = participantData;

      // Extract ticket responses from trace events
      const ticketResponses = traceEvents
        .filter((e: any) => e.type === 'ticket_closed')
        .map((e: any) => e.data);

      // Calculate performance if we have responses
      let performance = null;
      if (ticketResponses.length > 0) {
        try {
          performance = ticketService.calculatePerformanceMetrics(ticketResponses);
        } catch (error) {
          console.error('Error calculating performance:', error);
        }
      }

      participants.push({
        ...participantData,
        performance,
        ticketCount: ticketResponses.length,
      });
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'participantId',
        'ticketCount',
        'avgQualityScore',
        'avgErrorRate',
        'perceivedStress',
        'decisionConfidence',
        'selfEfficacy',
        'trustInSystem',
        'trustInSelf',
        'trustInDecisions',
        'processEngagement',
      ];

      const csvRows = participants.map((p) => [
        p.participantId,
        p.ticketCount || 0,
        p.performance?.averageQualityScore?.toFixed(2) || '',
        p.performance?.averageErrorRate?.toFixed(2) || '',
        p.survey?.perceivedStress || '',
        p.survey?.decisionConfidence || '',
        p.survey?.selfEfficacy || '',
        p.survey?.trustInSystem || '',
        p.survey?.trustInSelf || '',
        p.survey?.trustInDecisions || '',
        p.survey?.processEngagement || '',
      ]);

      const csv = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=experiment-data.csv',
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      totalParticipants: participants.length,
      participants,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
