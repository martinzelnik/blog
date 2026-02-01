import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  try {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }
    const userDoc = await User.findById(payload.userId).select('username role');
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Read role from document (get() reads raw DB value; lean() doesn't apply schema defaults)
    const dbRole = userDoc.get('role');
    const role = dbRole === 'admin' ? 'admin' : 'user';

    return NextResponse.json({
      id: userDoc._id.toString(),
      username: userDoc.username,
      role,
    });
  } catch (err) {
    console.error('GET /api/auth/me:', err);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
