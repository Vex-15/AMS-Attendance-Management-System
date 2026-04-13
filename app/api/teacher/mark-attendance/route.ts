import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { lectureId, attendanceData } = await request.json();
    // attendanceData = [{ studentId, status }, ...]

    if (!lectureId || !Array.isArray(attendanceData)) {
      return NextResponse.json(
        { error: 'lectureId and attendanceData array required' },
        { status: 400 }
      );
    }

    const db = getDB();

    // Validate lecture exists
    const lecture = db.lectures.get(lectureId);
    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Mark attendance
    let markedCount = 0;
    attendanceData.forEach(({ studentId, status }: { studentId: string; status: 'present' | 'absent' }) => {
      const attendanceId = `attendance-${studentId}-${lectureId}`;
      
      // Update or create attendance record
      db.attendance.set(attendanceId, {
        id: attendanceId,
        studentId,
        lectureId,
        status,
        markedAt: new Date(),
      });
      
      markedCount++;
    });

    saveDB();

    return NextResponse.json({
      success: true,
      markedCount,
      lectureId,
    });
  } catch (error) {
    console.error('[v0] Mark attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
