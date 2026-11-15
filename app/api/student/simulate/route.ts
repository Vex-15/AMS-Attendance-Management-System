import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { simulateMissingClasses } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const { studentId, subjectId, classesToMiss } = await request.json();

    if (
      typeof studentId !== 'string' ||
      typeof subjectId !== 'string' ||
      typeof classesToMiss !== 'number' ||
      Number.isNaN(classesToMiss)
    ) {
      return NextResponse.json(
        { error: 'studentId, subjectId and a numeric classesToMiss are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    if (!db.students.has(studentId)) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (!db.subjects.has(subjectId)) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const miss = Math.max(0, Math.min(40, Math.round(classesToMiss)));
    const result = simulateMissingClasses(studentId, subjectId, miss);
    const projectedStatus =
      result.predictedPercentage < 75
        ? 'at-risk'
        : result.predictedPercentage < 85
          ? 'warning'
          : 'safe';

    return NextResponse.json({
      ...result,
      target: 75,
      projectedStatus,
      drop: Math.round((result.currentPercentage - result.predictedPercentage) * 100) / 100,
    });
  } catch (error) {
    console.error('[AMS] Simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
