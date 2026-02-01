import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
    const serialized = posts.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      content: p.content,
      date: p.date,
      image: p.image,
      language: p.language,
    }));
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
    });
  } catch (err) {
    console.error('POST /api/posts:', err);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
