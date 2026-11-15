import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { getIndexes } from '@/lib/indexes';

export async function POST(request: NextRequest) {
  try {
    const { lectureId, attendanceData, teacherId } = await request.json();
    // attendanceData = [{ studentId, status }, ...]

    if (typeof lectureId !== 'string' || !Array.isArray(attendanceData)) {
      return NextResponse.json(
        { error: 'lectureId and attendanceData array required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const lecture = db.lectures.get(lectureId);
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    // Only students actually enrolled in this subject may be marked.
    const enrolledStudentIds = new Set(
      (getIndexes().enrollmentsBySubject.get(lecture.subjectId) ?? []).map(
        (enrollment) => enrollment.studentId
      )
    );

    let markedCount = 0;
    const skipped: string[] = [];

    for (const entry of attendanceData as Array<{ studentId?: unknown; status?: unknown }>) {
      const studentId = typeof entry?.studentId === 'string' ? entry.studentId : null;
      const status = entry?.status;

      if (
        !studentId ||
        (status !== 'present' && status !== 'absent') ||
        !enrolledStudentIds.has(studentId)
      ) {
        if (studentId) skipped.push(studentId);
        continue;
      }

      const attendanceId = `attendance-${studentId}-${lectureId}`;
      db.attendance.set(attendanceId, {
        id: attendanceId,
        studentId,
        lectureId,
        status,
        markedAt: new Date(),
      });
      markedCount++;
    }

    if (markedCount > 0) {
      saveDB();
      recordAudit({
        action: 'attendance.marked',
        summary: `Marked ${markedCount} student${markedCount === 1 ? '' : 's'} for lecture #${lecture.lectureNumber}`,
        actorId: teacherId ?? db.subjects.get(lecture.subjectId)?.teacherId,
        targetId: lectureId,
        metadata: { subjectId: lecture.subjectId, marked: markedCount },
      });
    }

    return NextResponse.json({
      success: true,
      markedCount,
      skippedCount: skipped.length,
      lectureId,
    });
  } catch (error) {
    console.error('[AMS] Mark attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
