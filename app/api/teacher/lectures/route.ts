import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const subjectId = request.nextUrl.searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json(
        { error: 'subjectId required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const subject = db.subjects.get(subjectId);

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    const lectures = Array.from(db.lectures.values())
      .filter((l) => l.subjectId === subjectId)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((l) => ({
        id: l.id,
        subjectId: l.subjectId,
        date: l.date.toISOString(),
        lectureNumber: l.lectureNumber,
      }));

    return NextResponse.json({ lectures });
  } catch (error) {
    console.error('[v0] Lectures fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
