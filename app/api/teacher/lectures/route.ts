import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, type Lecture } from '@/lib/db';
import { recordAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const subjectId = request.nextUrl.searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId required' }, { status: 400 });
    }

    const db = getDB();
    const subject = db.subjects.get(subjectId);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
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
    console.error('[AMS] Lectures fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Schedules the next lecture for a subject (today, 9:00) so it can be marked. */
export async function POST(request: NextRequest) {
  try {
    const { subjectId, date } = await request.json();

    if (typeof subjectId !== 'string' || !subjectId) {
      return NextResponse.json({ error: 'subjectId required' }, { status: 400 });
    }

    const db = getDB();
    const subject = db.subjects.get(subjectId);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const existing = Array.from(db.lectures.values()).filter(
      (lecture) => lecture.subjectId === subjectId
    );
    const lectureNumber =
      existing.reduce((max, lecture) => Math.max(max, lecture.lectureNumber), 0) + 1;

    const when = date ? new Date(date) : new Date();
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json({ error: 'Invalid lecture date' }, { status: 400 });
    }
    when.setHours(9, 0, 0, 0);

    const lecture: Lecture = {
      id: `lecture-${randomUUID()}`,
      subjectId,
      date: when,
      lectureNumber,
    };

    db.lectures.set(lecture.id, lecture);
    saveDB();
    recordAudit({
      action: 'lecture.created',
      summary: `Scheduled lecture #${lecture.lectureNumber} for ${subject.name} — ${subject.division}`,
      actorId: subject.teacherId,
      targetId: lecture.id,
      metadata: { subjectId, date: lecture.date.toISOString() },
    });

    return NextResponse.json(
      {
        lecture: {
          id: lecture.id,
          subjectId: lecture.subjectId,
          date: lecture.date.toISOString(),
          lectureNumber: lecture.lectureNumber,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[AMS] Lecture create error:', error);
    return NextResponse.json({ error: 'Unable to create lecture' }, { status: 500 });
  }
}
