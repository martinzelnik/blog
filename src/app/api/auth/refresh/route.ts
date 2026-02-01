import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokenFromRequest, verifyToken, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const newToken = await createToken({
      userId: payload.userId,
      username: payload.username,
    });

    return NextResponse.json({
      token: newToken,
      id: payload.userId,
      username: payload.username,
    });
  } catch (err) {
    console.error('POST /api/auth/refresh:', err);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
