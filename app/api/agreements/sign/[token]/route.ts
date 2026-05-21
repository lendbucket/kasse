import { NextResponse } from 'next/server';
import {
  consumeAgreementSignToken,
  AgreementSignError,
} from '@/lib/onboarding/agreement-sign-consume';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TOKEN_REGEX = /^[0-9a-f]{64}$/;

/**
 * POST /api/agreements/sign/[token]
 *
 * Public route — token IS the auth. Staff member submits their typed
 * name to sign. Atomically consumes the token and records the signature.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!TOKEN_REGEX.test(token)) {
      return NextResponse.json(
        { error: 'invalid_token', message: 'token format invalid' },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'invalid_json', message: 'request body must be JSON' },
        { status: 400 }
      );
    }

    const typedName =
      typeof body === 'object' && body !== null && 'typedName' in body
        ? String((body as { typedName: unknown }).typedName).trim()
        : '';

    if (typedName.length === 0) {
      return NextResponse.json(
        { error: 'typed_name_required', message: 'typedName is required' },
        { status: 400 }
      );
    }

    if (typedName.length > 200) {
      return NextResponse.json(
        { error: 'typed_name_too_long', message: 'typedName must be 200 chars or less' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const result = await consumeAgreementSignToken({
      rawToken: token,
      typedName,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { signedAt: result.signedAt.toISOString() },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof AgreementSignError) {
      const status =
        err.code === 'INVALID_TOKEN' ? 400 :
        err.code === 'TOKEN_ALREADY_CONSUMED' ? 410 :
        err.code === 'SESSION_EXPIRED' ? 410 :
        err.code === 'NAME_MISMATCH' ? 400 :
        err.code === 'STATE_MISMATCH' ? 409 :
        400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('agreement sign POST failed', {
      errorName: err instanceof Error ? err.name : 'unknown',
    });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
