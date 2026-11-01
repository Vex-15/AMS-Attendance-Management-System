import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDB();
  const teacherId = request.nextUrl.searchParams.get('teacherId');
  const studentId = request.nextUrl.searchParams.get('studentId');

  if (!teacherId || !studentId) {
    return NextResponse.json({ error: 'teacherId and studentId are required.' }, { status: 400 });
  }

  const teacher = db.teachers.get(teacherId);
  const student = db.students.get(studentId);
  if (!teacher || !student) {
    return NextResponse.json({ error: 'Teacher or student not found.' }, { status: 404 });
  }

  const teacherSubjectIds = new Set(teacher.subjects);
  const enrolledSubjectIds = new Set(
    Array.from(db.enrollments.values())
      .filter((enrollment) => enrollment.studentId === student.id && teacherSubjectIds.has(enrollment.subjectId))
      .map((enrollment) => enrollment.subjectId),
  );

  if (enrolledSubjectIds.size === 0) {
    return NextResponse.json({ error: 'This student is not enrolled in any of your subjects.' }, { status: 403 });
  }

  const user = db.users.get(student.userId);
  const subjects = Array.from(enrolledSubjectIds)
    .map((subjectId) => db.subjects.get(subjectId))
    .filter((subject) => subject !== undefined)
    .map((subject) => {
      const lectures = Array.from(db.lectures.values())
        .filter((lecture) => lecture.subjectId === subject.id)
        .map((lecture) => {
          const attendance = Array.from(db.attendance.values()).find(
            (record) => record.studentId === student.id && record.lectureId === lecture.id,
          );
          return {
            lectureId: lecture.id,
            date: lecture.date.toISOString(),
            lectureNumber: lecture.lectureNumber,
            status: attendance?.status || null,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
      const markedLectures = lectures.filter((lecture) => lecture.status !== null);
      const presentCount = markedLectures.filter((lecture) => lecture.status === 'present').length;

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        year: subject.year,
        division: subject.division,
        lectureCount: lectures.length,
        markedCount: markedLectures.length,
        presentCount,
        absentCount: markedLectures.length - presentCount,
        attendanceRate: markedLectures.length ? Math.round((presentCount / markedLectures.length) * 100) : 0,
        lectures,
      };
    });

  return NextResponse.json({
    student: {
      id: student.id,
      name: user?.name || 'Unknown student',
      branch: student.branch,
      year: student.year,
      division: student.division,
    },
    subjects,
  });
}