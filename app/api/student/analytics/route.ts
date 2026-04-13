import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import {
  getSubjectAnalytics,
  calculateClassesNeeded,
  analyzeTrend,
  getClassAnalytics,
  getTeacherNameForSubject,
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

    const db = getDB();
    const analytics = getSubjectAnalytics(studentId);
    
    // Build attendanceHistory and classAverages
    const attendanceHistory: Record<string, Array<{
      lectureId: string;
      date: string;
      status: 'present' | 'absent';
      lectureNumber: number;
      subjectName: string;
      subjectCode: string;
    }>> = {};

    const classAverages: Record<string, number> = {};

    const enrichedAnalytics = analytics.map((subject) => {
      const classesNeeded = calculateClassesNeeded(studentId, subject.subjectId);
      const trend = analyzeTrend(studentId, subject.subjectId);
      const teacherName = getTeacherNameForSubject(subject.subjectId);

      // Build attendance history for this subject
      const subjectLectures = Array.from(db.lectures.values())
        .filter((l) => l.subjectId === subject.subjectId)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const history = subjectLectures.map((lecture) => {
        const attendance = Array.from(db.attendance.values()).find(
          (a) => a.studentId === studentId && a.lectureId === lecture.id
        );
        return {
          lectureId: lecture.id,
          date: lecture.date.toISOString(),
          status: (attendance?.status || 'absent') as 'present' | 'absent',
          lectureNumber: lecture.lectureNumber,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
        };
      });

      attendanceHistory[subject.subjectId] = history;

      // Get class average for comparative chart
      const classAnalytics = getClassAnalytics(subject.subjectId);
      classAverages[subject.subjectId] = classAnalytics.classAverage;

      return {
        ...subject,
        classesNeeded,
        trend,
        teacherName,
        classAverage: classAnalytics.classAverage,
      };
    });

    return NextResponse.json({ 
      analytics: enrichedAnalytics,
      attendanceHistory,
      classAverages,
    });
  } catch (error) {
    console.error('[AMS] Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
