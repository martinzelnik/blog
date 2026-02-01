import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { requireAdmin, getAuthTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const token = getAuthTokenFromRequest(request);
    const payload = token ? await verifyToken(token) : null;
    const userId = payload?.userId ?? null;

    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
    const postIds = posts.map((p) => p._id);

    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const countByPost = Object.fromEntries(
      commentCounts.map((c) => [c._id.toString(), c.count])
    );

    const serialized = posts.map((p) => {
      const likedBy = (p as { likedBy?: unknown[] }).likedBy ?? [];
      const likeCount = likedBy.length;
      const likedByMe = userId
        ? likedBy.some((id) => id?.toString() === userId)
        : false;
      return {
        id: p._id.toString(),
        title: p.title,
        content: p.content,
        date: p.date,
        image: p.image,
        language: p.language,
        likeCount,
        likedByMe,
        commentCount: countByPost[p._id.toString()] ?? 0,
      };
    });
    return NextResponse.json(serialized);
  } catch (err) {
    console.error('GET /api/posts:', err);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const body = await request.json();
    const { title, content, date, image, language } = body;

    if (!title || !content || !date || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, date, language' },
        { status: 400 }
      );
    }

    if (language !== 'en' && language !== 'cs') {
      return NextResponse.json(
        { error: 'language must be "en" or "cs"' },
        { status: 400 }
      );
    }

    const post = await Post.create({
      title: String(title).trim(),
      content: String(content).trim(),
      date: String(date).trim(),
      image: image ? String(image) : undefined,
      language,
    });

    return NextResponse.json({
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      date: post.date,
      image: post.image,
      language: post.language,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    });
  } catch (err) {
    console.error('POST /api/posts:', err);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
