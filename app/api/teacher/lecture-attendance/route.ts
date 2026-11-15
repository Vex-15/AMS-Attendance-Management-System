import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const lectureId = request.nextUrl.searchParams.get('lectureId');

    if (!lectureId) {
      return NextResponse.json(
        { error: 'lectureId required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const lecture = db.lectures.get(lectureId);

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Get all enrolled students for this subject
    const enrollments = Array.from(db.enrollments.values()).filter(
      (e) => e.subjectId === lecture.subjectId
    );

    // Get existing attendance for this lecture
    const attendanceRecords = Array.from(db.attendance.values()).filter(
      (a) => a.lectureId === lectureId
    );

    // Roll numbers must match the analytics table: subject-code prefix + roster position.
    const subject = db.subjects.get(lecture.subjectId);
    const rollPrefix = (subject?.code || 'ST').substring(0, 2).toUpperCase();

    const students = enrollments.map((enrollment, index) => {
      const student = db.students.get(enrollment.studentId);
      const user = student ? db.users.get(student.userId) : null;
      const attendance = attendanceRecords.find(
        (a) => a.studentId === enrollment.studentId
      );

      return {
        studentId: enrollment.studentId,
        studentName: user?.name || 'Unknown',
        rollNumber: `${rollPrefix}${String(index + 1).padStart(3, '0')}`,
        division: student?.division || '',
        status: attendance?.status || null,
      };
    });

    return NextResponse.json({
      lectureId,
      subjectId: lecture.subjectId,
      date: lecture.date.toISOString(),
      lectureNumber: lecture.lectureNumber,
      students,
    });
  } catch (error) {
    console.error('[v0] Lecture attendance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
