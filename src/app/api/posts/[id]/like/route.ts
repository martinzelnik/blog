import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { requireAuth } from '@/lib/auth';

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

    const existing = (post.get('likedBy') as mongoose.Types.ObjectId[] | undefined) ?? [];
    const likedBy = [...existing];
    const userId = new mongoose.Types.ObjectId(payload.userId);
    const index = likedBy.findIndex((oid) => oid.equals(userId));
    let liked: boolean;
    if (index >= 0) {
      likedBy.splice(index, 1);
      liked = false;
    } else {
      likedBy.push(userId);
      liked = true;
    }
    post.set('likedBy', likedBy);
    await post.save();

    return NextResponse.json({ liked, likeCount: likedBy.length });
  } catch (err) {
    console.error('POST /api/posts/[id]/like:', err);
    return NextResponse.json(
      { error: 'Failed to update like' },
      { status: 500 }
    );
  }
}
