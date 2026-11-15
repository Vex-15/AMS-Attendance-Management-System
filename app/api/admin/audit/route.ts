import { NextRequest, NextResponse } from 'next/server';
import { listAudit } from '@/lib/audit';
import { getDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDB();
  const adminId = request.nextUrl.searchParams.get('adminId');

  if (!adminId || db.users.get(adminId)?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 25);
  const offset = Number(request.nextUrl.searchParams.get('offset') ?? 0);

  const result = listAudit({
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
    action: request.nextUrl.searchParams.get('action'),
    query: request.nextUrl.searchParams.get('query'),
  });

  return NextResponse.json(result);
}
