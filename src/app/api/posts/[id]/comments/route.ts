import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { requireAuth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }
    await dbConnect();

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comments = await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .lean();
    const serialized = comments.map((c) => ({
      id: c._id.toString(),
      postId: id,
      userId: (c as { user: mongoose.Types.ObjectId }).user.toString(),
      username: (c as { username: string }).username,
      text: (c as { text: string }).text,
      createdAt: (c as { createdAt: Date }).createdAt,
    }));
    return NextResponse.json(serialized);
  } catch (err) {
    console.error('GET /api/posts/[id]/comments:', err);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { payload } = authResult;

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
    }
    await dbConnect();

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const comment = await Comment.create({
      post: id,
      user: payload.userId,
      username: payload.username,
      text,
    });

    return NextResponse.json({
      id: comment._id.toString(),
      postId: id,
      userId: payload.userId,
      username: payload.username,
      text: comment.text,
      createdAt: comment.createdAt,
    });
  } catch (err) {
    console.error('POST /api/posts/[id]/comments:', err);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
