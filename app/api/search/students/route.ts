import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { getIndexes } from '@/lib/indexes';
import { searchStudents, filterAttendanceByStatus } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query') || '';
    const teacherId = request.nextUrl.searchParams.get('teacherId');
    const studentId = request.nextUrl.searchParams.get('studentId');

    // Direct lookup, used when deep-linking to a single student profile.
    if (studentId) {
      const db = getDB();
      const student = db.students.get(studentId);
      const studentUser = student ? db.users.get(student.userId) : undefined;

      if (!student || !studentUser) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      return NextResponse.json({
        student: {
          id: student.id,
          userId: student.userId,
          branch: student.branch,
          year: student.year,
          division: student.division,
          user: { name: studentUser.name, email: studentUser.email },
        },
      });
    }
    const status = request.nextUrl.searchParams.get('status') as
      | 'at-risk'
      | 'warning'
      | 'safe'
      | 'all'
      | null;

    if (query && !status) {
      // Search by name/email
      let results = searchStudents(query);

      // Faculty only see students enrolled in the sections they teach.
      if (teacherId) {
        const db = getDB();
        const teacher = db.teachers.get(teacherId);
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher not found' }, { status: 403 });
        }

        const { enrollmentsBySubject } = getIndexes();
        const accessibleStudentIds = new Set<string>();
        for (const subjectId of teacher.subjects) {
          for (const enrollment of enrollmentsBySubject.get(subjectId) ?? []) {
            accessibleStudentIds.add(enrollment.studentId);
          }
        }

        results = results.filter((student) => accessibleStudentIds.has(student.id));
      }

      return NextResponse.json({ results });
    }

    if (status) {
      // This would require studentId context, but we can return empty for now
      return NextResponse.json({
        error: 'Use /api/student/analytics for status filtering',
      });
    }

    return NextResponse.json(
      { error: 'query or status parameter required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
