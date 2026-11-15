import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { DATA_FILE, getDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Lightweight readiness probe: dataset size, freshness and persistence state. */
export async function GET() {
  const db = getDB();
  const latestLecture = Array.from(db.lectures.values()).reduce<Date | null>(
    (latest, lecture) => (!latest || lecture.date > latest ? lecture.date : latest),
    null
  );

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    persistence: {
      file: 'data/db.json',
      available: fs.existsSync(DATA_FILE),
      revision: db.revision,
    },
    counts: {
      users: db.users.size,
      students: db.students.size,
      teachers: db.teachers.size,
      subjects: db.subjects.size,
      enrollments: db.enrollments.size,
      lectures: db.lectures.size,
      attendance: db.attendance.size,
    },
    latestLectureDate: latestLecture ? latestLecture.toISOString() : null,
  });
}
