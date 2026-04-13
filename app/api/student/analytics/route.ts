import { NextRequest, NextResponse } from 'next/server';
import {
  getSubjectAnalytics,
  calculateClassesNeeded,
  analyzeTrend,
  simulateMissingClasses,
} from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    const analytics = getSubjectAnalytics(studentId);
    
    // Enrich with additional analysis for each subject
    const enrichedAnalytics = analytics.map((subject) => {
      const classesNeeded = calculateClassesNeeded(studentId, subject.subjectId);
      const trend = analyzeTrend(studentId, subject.subjectId);

      return {
        ...subject,
        classesNeeded,
        trend,
      };
    });

    return NextResponse.json({ analytics: enrichedAnalytics });
  } catch (error) {
    console.error('[v0] Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
