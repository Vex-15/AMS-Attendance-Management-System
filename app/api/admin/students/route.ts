import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDB, type Database, type Student } from '@/lib/db';

function isAdmin(db: Database, adminId: unknown) {
  return typeof adminId === 'string' && db.users.get(adminId)?.role === 'admin';
}

function getStudentSubjects(db: Database, branch: string, year: number, division: string) {
  return Array.from(db.subjects.values()).filter(
    (subject) => subject.branch === branch && subject.year === year && subject.division === division,
  );
}

function studentDetails(db: Database, student: Student) {
  const user = db.users.get(student.userId);
  const subjectIds = new Set(
    Array.from(db.enrollments.values())
      .filter((enrollment) => enrollment.studentId === student.id)
      .map((enrollment) => enrollment.subjectId),
  );
  const lectureIds = new Set(
    Array.from(db.lectures.values())
      .filter((lecture) => subjectIds.has(lecture.subjectId))
      .map((lecture) => lecture.id),
  );
  const records = Array.from(db.attendance.values()).filter(
    (attendance) => attendance.studentId === student.id && lectureIds.has(attendance.lectureId),
  );
  const present = records.filter((record) => record.status === 'present').length;

  return {
    id: student.id,
    name: user?.name || 'Unknown student',
    email: user?.email || '',
    branch: student.branch,
    year: student.year,
    division: student.division,
    attendanceRate: records.length ? Math.round((present / records.length) * 100) : 0,
    presentCount: present,
    attendanceCount: records.length,
    subjectCount: subjectIds.size,
  };
}

function getAdminData(db: Database) {
  const students = Array.from(db.students.values()).map((student) => studentDetails(db, student));
  const branchNames = Array.from(new Set([
    ...Array.from(db.subjects.values(), (subject) => subject.branch),
    ...students.map((student) => student.branch),
  ])).sort();

  const branches = branchNames.map((branch) => {
    const branchStudents = students.filter((student) => student.branch === branch);
    const studentIds = new Set(branchStudents.map((student) => student.id));
    const subjectIds = new Set(
      Array.from(db.subjects.values())
        .filter((subject) => subject.branch === branch)
        .map((subject) => subject.id),
    );
    const lectureIds = new Set(
      Array.from(db.lectures.values())
        .filter((lecture) => subjectIds.has(lecture.subjectId))
        .map((lecture) => lecture.id),
    );
    const records = Array.from(db.attendance.values()).filter(
      (record) => studentIds.has(record.studentId) && lectureIds.has(record.lectureId),
    );
    const present = records.filter((record) => record.status === 'present').length;
    const yearCounts = Object.fromEntries([1, 2, 3, 4].map((year) => [
      year,
      branchStudents.filter((student) => student.year === year).length,
    ]));

    return {
      name: branch,
      studentCount: branchStudents.length,
      subjectCount: subjectIds.size,
      lectureCount: lectureIds.size,
      attendanceCount: records.length,
      attendanceRate: records.length ? Math.round((present / records.length) * 100) : 0,
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

    return NextResponse.json({ student: studentDetails(db, student) }, { status: 201 });
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

    return NextResponse.json({ student: studentDetails(db, student) });
  } catch (error) {
    console.error('[AMS] Admin student update error:', error);
    return NextResponse.json({ error: 'Unable to update student.' }, { status: 500 });
  }
}