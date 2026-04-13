import { NextRequest, NextResponse } from 'next/server';
import { simulateMissingClasses } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const { studentId, subjectId, classesToMiss } = await request.json();

    if (!studentId || !subjectId || classesToMiss === undefined) {
      return NextResponse.json(
        { error: 'studentId, subjectId, and classesToMiss required' },
        { status: 400 }
      );
    }

    const result = simulateMissingClasses(studentId, subjectId, classesToMiss);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[v0] Simulation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
