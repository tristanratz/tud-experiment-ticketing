import { NextResponse } from 'next/server';
import { knowledgeService } from '@/lib/knowledge';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY' },
        { status: 500 }
      );
    }

    const { messages, currentTicket } = await request.json() as {
      messages?: { role?: string; content?: string }[];
      currentTicket?: { id?: string; subject?: string; description?: string };
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing messages' },
        { status: 400 }
      );
    }

    const docs = knowledgeService.getKnowledgeDocuments();
    const knowledgeContext = docs
      .map((doc) => `# ${doc.title}\n${doc.content}`)
      .join('\n\n');

    const ticketContext = currentTicket?.id && currentTicket?.subject && currentTicket?.description
      ? `\n\nCurrent ticket context:\nID: ${currentTicket.id}\nSubject: ${currentTicket.subject}\nDescription: ${currentTicket.description}`
      : '';

    const systemPrompt = [
      'You are a support assistant for a research study.',
      'Answer ONLY using the knowledge base content provided.',
      'If the answer is not in the knowledge base, say you do not know based on the knowledge base.',
      'Keep responses concise and professional.',
    ].join(' ');

    const recentMessages = messages.slice(-10).flatMap((message) => {
      if (!message?.role || !message?.content) return [];
      return [{
        role: message.role,
        content: message.content,
      }];
    });

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nKnowledge Base:\n${knowledgeContext}${ticketContext}`,
          },
          ...recentMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'OpenAI request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
