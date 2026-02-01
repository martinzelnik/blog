import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ username: trimmedUsername });
    if (existing) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const user = await User.create({
      username: trimmedUsername,
      password,
    });

    const role = (user as { role?: string }).role === 'admin' ? 'admin' : 'user';
    const token = await createToken({
      userId: user._id.toString(),
      username: user.username,
      role,
    });

    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      role,
      token,
      message: 'Sign up successful',
    });
  } catch (err) {
    console.error('POST /api/auth/register:', err);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
