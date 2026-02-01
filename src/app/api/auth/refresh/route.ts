import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokenFromRequest, verifyToken, createToken, type TokenPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload: TokenPayload | null = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const newToken = await createToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    });

    return NextResponse.json({
      token: newToken,
      id: payload.userId,
      username: payload.username,
      role: payload.role,
    });
  } catch (err) {
    console.error('POST /api/auth/refresh:', err);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
