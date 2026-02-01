import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

const secret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const username = payload.username as string;
    const role = (payload.role === 'admin' ? 'admin' : 'user') as TokenPayload['role'];
    if (userId && username) {
      return { userId, username, role };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAuthTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim() || null;
}

export async function requireAuth(
  request: Request
): Promise<{ payload: TokenPayload } | NextResponse> {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  return { payload };
}

export async function requireAdmin(
  request: Request
): Promise<{ payload: TokenPayload } | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (result.payload.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }
  return result;
}
