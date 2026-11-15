import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, type Database, type Student } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { getIndexes } from '@/lib/indexes';
import { getAttendanceStats } from '@/lib/services';

function isAdmin(db: Database, adminId: unknown) {
  return typeof adminId === 'string' && db.users.get(adminId)?.role === 'admin';
}

function getStudentSubjects(db: Database, branch: string, year: number, division: string) {
  return Array.from(db.subjects.values()).filter(
    (subject) => subject.branch === branch && subject.year === year && subject.division === division,
  );
}

function studentDetails(student: Student) {
  const db = getDB();
  const user = db.users.get(student.userId);
  const stats = getAttendanceStats(student.id);
  const enrollments = getIndexes().enrollmentsByStudent.get(student.id) ?? [];

  return {
    id: student.id,
    name: user?.name || 'Unknown student',
    email: user?.email || '',
    branch: student.branch,
    year: student.year,
    division: student.division,
    attendanceRate: Math.round(stats.percentage),
    presentCount: stats.totalPresent,
    attendanceCount: stats.totalLectures,
    subjectCount: new Set(enrollments.map((enrollment) => enrollment.subjectId)).size,
  };
}

function getAdminData(db: Database) {
  const students = Array.from(db.students.values()).map((student) => studentDetails(student));
  const { lectureSubject } = getIndexes();

  const branchNames = Array.from(
    new Set([
      ...Array.from(db.subjects.values(), (subject) => subject.branch),
      ...students.map((student) => student.branch),
    ]),
  ).sort();

  // One pass per collection keeps this O(n) even with a few hundred students.
  const subjectBranch = new Map<string, string>();
  const subjectCounts = new Map<string, number>();
  for (const subject of db.subjects.values()) {
    subjectBranch.set(subject.id, subject.branch);
    subjectCounts.set(subject.branch, (subjectCounts.get(subject.branch) ?? 0) + 1);
  }

  const lectureCounts = new Map<string, number>();
  for (const lecture of db.lectures.values()) {
    const branch = subjectBranch.get(lecture.subjectId);
    if (branch) lectureCounts.set(branch, (lectureCounts.get(branch) ?? 0) + 1);
  }

  const attendanceTotals = new Map<string, { total: number; present: number }>();
  for (const record of db.attendance.values()) {
    const subjectId = lectureSubject.get(record.lectureId);
    const branch = subjectId ? subjectBranch.get(subjectId) : undefined;
    if (!branch) continue;

    const totals = attendanceTotals.get(branch) ?? { total: 0, present: 0 };
    totals.total += 1;
    if (record.status === 'present') totals.present += 1;
    attendanceTotals.set(branch, totals);
  }

  const branches = branchNames.map((branch) => {
    const branchStudents = students.filter((student) => student.branch === branch);
    const totals = attendanceTotals.get(branch) ?? { total: 0, present: 0 };
    const yearCounts = Object.fromEntries(
      [1, 2, 3, 4].map((year) => [
        year,
        branchStudents.filter((student) => student.year === year).length,
      ]),
    );

    return {
      name: branch,
      studentCount: branchStudents.length,
      subjectCount: subjectCounts.get(branch) ?? 0,
      lectureCount: lectureCounts.get(branch) ?? 0,
      attendanceCount: totals.total,
      attendanceRate: totals.total ? Math.round((totals.present / totals.total) * 100) : 0,
      yearCounts,
    };
  });

  return { branches, students };
}

export async function GET(request: NextRequest) {
  const db = getDB();
  if (!isAdmin(db, request.nextUrl.searchParams.get('adminId'))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return NextResponse.json(getAdminData(db));
}

export async function POST(request: NextRequest) {
  const db = getDB();

  try {
    const body = await request.json();
    if (!isAdmin(db, body.adminId)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const branch = typeof body.branch === 'string' ? body.branch : '';
    const year = Number(body.year);
    const division = typeof body.division === 'string' ? body.division : '';
    const subjects = getStudentSubjects(db, branch, year, division);

    if (!name || !email || !email.includes('@') || password.length < 6) {
      return NextResponse.json({ error: 'Enter a name, valid email, and password with at least 6 characters.' }, { status: 400 });
    }
    if (![1, 2, 3, 4].includes(year) || !['A', 'B', 'C'].includes(division) || subjects.length === 0) {
      return NextResponse.json({ error: 'Choose a valid branch, year, and division with available subjects.' }, { status: 400 });
    }
    if (Array.from(db.users.values()).some((user) => user.email.toLowerCase() === email)) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const userId = `user-${randomUUID()}`;
    const studentId = `student-${randomUUID()}`;
    const student: Student = { id: studentId, userId, branch, year, division };
    db.users.set(userId, { id: userId, name, email, password, role: 'student', createdAt: new Date() });
    db.students.set(studentId, student);
    subjects.forEach((subject) => {
      const enrollmentId = `enrollment-${studentId}-${subject.id}`;
      db.enrollments.set(enrollmentId, {
        id: enrollmentId,
        studentId,
        subjectId: subject.id,
        enrolledAt: new Date(),
      });
    });

    saveDB();
    recordAudit({
      action: 'student.created',
      summary: `Created student ${name} (${branch} · Year ${year} · Div ${division})`,
      actorId: body.adminId,
      targetId: studentId,
      metadata: { email },
    });

    return NextResponse.json({ student: studentDetails(student) }, { status: 201 });
  } catch (error) {
    console.error('[AMS] Admin student create error:', error);
    return NextResponse.json({ error: 'Unable to create student.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const db = getDB();

  try {
    const body = await request.json();
    if (!isAdmin(db, body.adminId)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const student = typeof body.studentId === 'string' ? db.students.get(body.studentId) : undefined;
    const user = student ? db.users.get(student.userId) : undefined;
    if (!student || !user) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const branch = typeof body.branch === 'string' ? body.branch : '';
    const year = Number(body.year);
    const division = typeof body.division === 'string' ? body.division : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const subjects = getStudentSubjects(db, branch, year, division);

    if (!name || !email || !email.includes('@') || (password && password.length < 6)) {
      return NextResponse.json({ error: 'Enter a name, valid email, and optional password with at least 6 characters.' }, { status: 400 });
    }
    if (![1, 2, 3, 4].includes(year) || !['A', 'B', 'C'].includes(division) || subjects.length === 0) {
      return NextResponse.json({ error: 'Choose a valid branch, year, and division with available subjects.' }, { status: 400 });
    }
    if (Array.from(db.users.values()).some((existing) => existing.id !== user.id && existing.email.toLowerCase() === email)) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const academicGroupChanged = student.branch !== branch || student.year !== year || student.division !== division;
    user.name = name;
    user.email = email;
    if (password) user.password = password;
    student.branch = branch;
    student.year = year;
    student.division = division;

    if (academicGroupChanged) {
      for (const [enrollmentId, enrollment] of db.enrollments) {
        if (enrollment.studentId === student.id) db.enrollments.delete(enrollmentId);
      }
      subjects.forEach((subject) => {
        const enrollmentId = `enrollment-${student.id}-${subject.id}`;
        db.enrollments.set(enrollmentId, {
          id: enrollmentId,
          studentId: student.id,
          subjectId: subject.id,
          enrolledAt: new Date(),
        });
      });
    }

    saveDB();
    recordAudit({
      action: academicGroupChanged ? 'student.moved' : 'student.updated',
      summary: academicGroupChanged
        ? `Moved ${name} to ${branch} · Year ${year} · Div ${division}`
        : `Updated details for ${name}`,
      actorId: body.adminId,
      targetId: student.id,
    });

    return NextResponse.json({ student: studentDetails(student) });
  } catch (error) {
    console.error('[AMS] Admin student update error:', error);
    return NextResponse.json({ error: 'Unable to update student.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const db = getDB();

  try {
    const body = await request.json();
    if (!isAdmin(db, body.adminId)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const student =
      typeof body.studentId === 'string' ? db.students.get(body.studentId) : undefined;
    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    let enrollmentsRemoved = 0;
    for (const [id, enrollment] of db.enrollments) {
      if (enrollment.studentId === student.id) {
        db.enrollments.delete(id);
        enrollmentsRemoved++;
      }
    }

    let attendanceRemoved = 0;
    for (const [id, record] of db.attendance) {
      if (record.studentId === student.id) {
        db.attendance.delete(id);
        attendanceRemoved++;
      }
    }

    const removedName = db.users.get(student.userId)?.name || student.id;

    db.students.delete(student.id);
    db.users.delete(student.userId);

    saveDB();
    recordAudit({
      action: 'student.deleted',
      summary: `Removed ${removedName} and ${attendanceRemoved} attendance records`,
      actorId: body.adminId,
      targetId: student.id,
    });

    return NextResponse.json({
      deleted: student.id,
      enrollmentsRemoved,
      attendanceRemoved,
    });
  } catch (error) {
    console.error('[AMS] Admin student delete error:', error);
    return NextResponse.json({ error: 'Unable to delete student.' }, { status: 500 });
  }
}
