import { NextRequest, NextResponse } from 'next/server';
import { getDB, type Database } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isAdmin(db: Database, adminId: unknown) {
  return typeof adminId === 'string' && db.users.get(adminId)?.role === 'admin';
}

/** Monday-anchored week key, so buckets never split a teaching week. */
function weekKey(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** Institute-wide counters and the rolling 6-month attendance trend. */
export async function GET(request: NextRequest) {
  const db = getDB();

  if (!isAdmin(db, request.nextUrl.searchParams.get('adminId'))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const counts = {
    totalUsers: db.users.size,
    totalStudents: db.students.size,
    totalTeachers: db.teachers.size,
    totalSubjects: db.subjects.size,
    totalEnrollments: db.enrollments.size,
    totalLectures: db.lectures.size,
    totalAttendance: db.attendance.size,
  };

  // Bucket the last eight weeks, newest last, in a single pass over attendance.
  const weeks: { key: string; period: string }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    weeks.push({
      key: start.toISOString().slice(0, 10),
      period: start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    });
  }

  const lectureWeek = new Map<string, string>();
  for (const lecture of db.lectures.values()) {
    lectureWeek.set(lecture.id, weekKey(lecture.date));
  }

  const buckets = new Map<string, { total: number; present: number }>();
  for (const record of db.attendance.values()) {
    const key = lectureWeek.get(record.lectureId);
    if (!key) continue;

    const bucket = buckets.get(key) ?? { total: 0, present: 0 };
    bucket.total += 1;
    if (record.status === 'present') bucket.present += 1;
    buckets.set(key, bucket);
  }

  const bucketed = weeks.map(({ key, period }) => {
    const bucket = buckets.get(key);
    return {
      period,
      total: bucket?.total ?? 0,
      percentage:
        bucket && bucket.total > 0 ? Math.round((bucket.present / bucket.total) * 1000) / 10 : 0,
    };
  });

  // Trim empty leading/trailing weeks so the chart starts where the term starts.
  const firstIndex = bucketed.findIndex((week) => week.total > 0);
  const lastIndex = bucketed.reduce((last, week, index) => (week.total > 0 ? index : last), -1);
  const weeklyTrend =
    firstIndex === -1
      ? bucketed.map(({ period, percentage }) => ({ period, percentage }))
      : bucketed
          .slice(firstIndex, lastIndex + 1)
          .map(({ period, percentage }) => ({ period, percentage }));

  const density = (
    (counts.totalAttendance /
      Math.max(
        1,
        counts.totalEnrollments * (counts.totalLectures / Math.max(1, counts.totalSubjects))
      )) *
    100
  ).toFixed(0);

  return NextResponse.json({
    counts,
    weeklyTrend,
    density: Number(density),
    latestLectureDate: Array.from(db.lectures.values()).reduce<Date | null>(
      (latest, lecture) => (!latest || lecture.date > latest ? lecture.date : latest),
      null
    ),
  });
}
