import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { getAttendanceStats, getSubjectAnalytics } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const branch = request.nextUrl.searchParams.get('branch');
    const year = request.nextUrl.searchParams.get('year');
    const division = request.nextUrl.searchParams.get('division');
    const subjectId = request.nextUrl.searchParams.get('subjectId');

    const db = getDB();

    // Filter students by branch, year, division
    let students = Array.from(db.students.values());

    if (branch) {
      students = students.filter((s) => s.branch === branch);
    }
    if (year) {
      students = students.filter((s) => s.year === Number(year));
    }
    if (division) {
      students = students.filter((s) => s.division === division);
    }

    // Calculate stats for each student
    const rankedStudents = students.map((student) => {
      const user = db.users.get(student.userId);

      if (subjectId) {
        // Subject-specific ranking
        const stats = getAttendanceStats(student.id, subjectId);
        return {
          studentId: student.id,
          name: user?.name || 'Unknown',
          division: student.division,
          branch: student.branch,
          year: student.year,
          overallPercentage: stats.percentage,
          status: stats.status,
          statusLabel: stats.statusLabel,
          totalPresent: stats.totalPresent,
          totalLectures: stats.totalLectures,
        };
      } else {
        // Overall ranking across all subjects
        const analytics = getSubjectAnalytics(student.id);
        const avgPercentage =
          analytics.length > 0
            ? analytics.reduce((sum, a) => sum + a.stats.percentage, 0) / analytics.length
            : 0;

        let status: 'safe' | 'warning' | 'at-risk';
        let statusLabel: string;
        if (avgPercentage >= 85) {
          status = 'safe';
          statusLabel = 'Safe';
        } else if (avgPercentage >= 75) {
          status = 'warning';
          statusLabel = 'Warning';
        } else {
          status = 'at-risk';
          statusLabel = 'At Risk';
        }

        return {
          studentId: student.id,
          name: user?.name || 'Unknown',
          division: student.division,
          branch: student.branch,
          year: student.year,
          overallPercentage: Math.round(avgPercentage * 100) / 100,
          status,
          statusLabel,
          totalPresent: analytics.reduce((s, a) => s + a.stats.totalPresent, 0),
          totalLectures: analytics.reduce((s, a) => s + a.stats.totalLectures, 0),
        };
      }
    });

    // Sort by percentage descending
    rankedStudents.sort((a, b) => b.overallPercentage - a.overallPercentage);

    // Add rank
    const ranked = rankedStudents.map((s, idx) => ({
      ...s,
      rank: idx + 1,
    }));

    // Calculate class average
    const classAverage =
      ranked.length > 0
        ? Math.round(
            (ranked.reduce((sum, s) => sum + s.overallPercentage, 0) / ranked.length) * 100
          ) / 100
        : 0;

    return NextResponse.json({
      leaderboard: ranked,
      classAverage,
      totalStudents: ranked.length,
    });
  } catch (error) {
    console.error('[v0] Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
