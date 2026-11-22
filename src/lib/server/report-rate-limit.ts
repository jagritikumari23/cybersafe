import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function enforceReportRateLimit(
  request: NextRequest,
  scope: 'submit' | 'track',
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const trustedIpHeader = process.env.CYBERSAFE_TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (process.env.NODE_ENV === 'production' && !trustedIpHeader) {
    console.error('Trusted client IP header is not configured.');
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const candidateAddress = trustedIpHeader
    ? request.headers.get(trustedIpHeader)?.trim()
    : '127.0.0.1';
  if (!candidateAddress || isIP(candidateAddress) === 0) {
    console.error('Trusted client IP header is missing or invalid.');
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const address = candidateAddress;
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
  } catch {
    console.error('Report rate-limit check failed.');
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}