import { NextResponse } from 'next/server';
import { knowledgeService } from '@/lib/knowledge';

export async function GET() {
  try {
    const tree = knowledgeService.buildKnowledgeTree();
    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Error building knowledge tree:', error);
    return NextResponse.json({ tree: [] });
  }
}
