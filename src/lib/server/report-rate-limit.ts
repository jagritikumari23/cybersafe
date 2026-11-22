import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

function getClientIp(request: NextRequest): string {
  const configuredHeader = process.env.CYBERSAFE_TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();

  const headersToCheck = configuredHeader
    ? [configuredHeader]
    : ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for'];

  for (const headerName of headersToCheck) {
    const rawVal = request.headers.get(headerName);
    if (!rawVal) continue;
    // Proxies like Vercel or Cloudflare may send a comma-separated list of IPs
    const candidate = rawVal.split(',')[0].trim();
    if (candidate && isIP(candidate) !== 0) {
      return candidate;
    }
  }

  return '127.0.0.1';
}

export async function enforceReportRateLimit(
  request: NextRequest,
  scope: 'submit' | 'track',
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('Database configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) is missing in server environment.');
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Missing database environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 503 }
    );
  }

  const address = getClientIp(request);
  const rateKey = createHmac('sha256', serviceRoleKey)
    .update(`${scope}:${address}`)
    .digest('hex');

  try {
    const { data, error } = await getSupabaseAdminClient().rpc('consume_api_rate_limit', {
      p_rate_key: rateKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : null;
    if (!result || typeof result.allowed !== 'boolean') {
      throw new Error('Rate limiter returned an invalid response.');
    }

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(result.retry_after_seconds ?? windowSeconds) },
        }
      );
    }

    return null;
  } catch (err: any) {
    console.error('Report rate-limit check failed:', err?.message || err);
    const message = err?.message && err.message.includes('SUPABASE')
      ? err.message
      : 'Service temporarily unavailable.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
