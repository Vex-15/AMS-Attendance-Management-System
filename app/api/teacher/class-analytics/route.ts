import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { getClassAnalytics } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.nextUrl.searchParams.get('teacherId');
    const subjectId = request.nextUrl.searchParams.get('subjectId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const teacher = Array.from(db.teachers.values()).find(
      (t) => t.id === teacherId
    );

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // If specific subject requested, return analytics for that subject
    if (subjectId) {
      const analytics = getClassAnalytics(subjectId);
      return NextResponse.json(analytics);
    }

    // Otherwise, return analytics for all teacher's subjects
    const allAnalytics = teacher.subjects.map((sid) => getClassAnalytics(sid));

    return NextResponse.json({ subjects: allAnalytics });
  } catch (error) {
    console.error('[v0] Class analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
