import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge middleware: gives every request an id, throttles API writes and logs
 * slow or failed API calls. Kept dependency-free on purpose.
 */

const WINDOW_MS = 60_000;
const MAX_WRITES_PER_WINDOW = 90;

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  return `${ip}:${request.method}`;
}

function checkRateLimit(request: NextRequest) {
  const now = Date.now();
  const key = clientKey(request);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_WRITES_PER_WINDOW - 1, resetAt: now + WINDOW_MS };
  }

  bucket.count += 1;

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5_000) {
    for (const [entryKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(entryKey);
    }
  }

  return {
    limited: bucket.count > MAX_WRITES_PER_WINDOW,
    remaining: Math.max(0, MAX_WRITES_PER_WINDOW - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const isWrite = request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS';
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  if (isApi && isWrite) {
    const { limited, remaining, resetAt } = checkRateLimit(request);

    if (limited) {
      console.warn(`[ams] ${requestId} ${request.method} ${pathname} 429 rate-limited`);

      return NextResponse.json(
        { error: 'Too many requests. Please slow down and try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
            'X-Request-Id': requestId,
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-RateLimit-Limit', String(MAX_WRITES_PER_WINDOW));
    response.headers.set('X-RateLimit-Remaining', String(remaining));

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ams] ${requestId} ${request.method} ${pathname} (${Date.now() - startedAt}ms)`);
    }

    return response;
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$).*)'],
};
