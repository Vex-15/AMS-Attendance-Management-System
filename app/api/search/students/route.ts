import { NextRequest, NextResponse } from 'next/server';
import { searchStudents, filterAttendanceByStatus } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query') || '';
    const status = request.nextUrl.searchParams.get('status') as
      | 'at-risk'
      | 'warning'
      | 'safe'
      | 'all'
      | null;

    if (query && !status) {
      // Search by name/email
      const results = searchStudents(query);
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
