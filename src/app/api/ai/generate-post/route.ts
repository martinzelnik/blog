import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured' },
      { status: 500 }
    );
  }

  let body: { image?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { image, language } = body;
  const lang = language === 'cs' ? 'cs' : 'en';

  if (!image || typeof image !== 'string') {
    return NextResponse.json(
      { error: 'Image (base64 data URL) is required' },
      { status: 400 }
    );
  }

  if (!image.startsWith('data:image/')) {
    return NextResponse.json(
      { error: 'Image must be a valid data URL (e.g. data:image/jpeg;base64,...)' },
      { status: 400 }
    );
  }

  const { mimeType, base64Data } = parseDataUrl(image);
  if (!base64Data) {
    return NextResponse.json(
      { error: 'Invalid image data URL' },
      { status: 400 }
    );
  }

  const systemPrompt =
    lang === 'cs'
      ? `Jsi asistent pro psaní blogových příspěvků. Na základě obrázku vygeneruj krátký blogový příspěvek.
Vrať JSON objekt s klíči "title" (nadpis, max 80 znaků) a "content" (tělo příspěvku, 2-4 odstavce).
Piš výhradně česky a vtipne, klidne i cerny humor.`
      : `You are a blog post assistant. Based on the image, generate a short blog post.
Return a JSON object with keys "title" (headline, max 80 chars) and "content" (body, 2-4 paragraphs).
Write in English only and be funny, feel free to use the dark humor.`;

  const userPrompt =
    lang === 'cs'
      ? 'Analyzuj tento obrázek a vygeneruj blogový příspěvek. Vrať pouze platný JSON.'
      : 'Analyze this image and generate a blog post. Return only valid JSON.';

  const requestBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          { text: userPrompt },
        ],
      },
    ],
    generation_config: {
      max_output_tokens: 1024,
      thinking_config: { thinking_budget: 0 },
    },
  };

  const maxRetries = 2;
  let lastErr: unknown;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post<{
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        }>(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          requestBody,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const data = response.data;
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    let raw = '';
    for (const part of parts) {
      const text = (part as { text?: string; thought?: boolean }).text?.trim();
      if (text && !(part as { thought?: boolean }).thought) {
        raw = text;
        break;
      }
      if (text) raw = text;
    }
    if (!raw) {
      return NextResponse.json(
        { error: 'No content returned from AI' },
        { status: 502 }
      );
    }

    const json = extractJson(raw);
    const title = typeof json?.title === 'string' ? json.title.trim() : '';
    const content = typeof json?.content === 'string' ? json.content.trim() : '';

    if (!title || !content) {
      return NextResponse.json(
        { error: 'AI did not return valid title and content' },
        { status: 502 }
      );
    }

        return NextResponse.json({ title, content });
      } catch (attemptErr) {
        lastErr = attemptErr;
        if (
          axios.isAxiosError(attemptErr) &&
          attemptErr.response?.status === 500 &&
          attempt < maxRetries
        ) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw attemptErr;
      }
    }
  } catch (err) {
    const e = err ?? lastErr;
    if (axios.isAxiosError(e) && e.response) {
      console.error('Gemini API error:', e.response.status, e.response.data);
      const msg =
        e.response.status === 500
          ? 'AI service temporarily unavailable. Please try again.'
          : 'Failed to generate content from image';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    console.error('POST /api/ai/generate-post:', e ?? err);
    return NextResponse.json(
      { error: 'Failed to generate post content' },
      { status: 500 }
    );
  }
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string | null } {
  const base64Marker = ';base64,';
  const idx = dataUrl.indexOf(base64Marker);
  if (idx === -1) return { mimeType: 'image/jpeg', base64Data: null };
  const mimeType = dataUrl.slice(5, idx);
  const base64Data = dataUrl.slice(idx + base64Marker.length);
  if (!mimeType.startsWith('image/') || !base64Data) {
    return { mimeType: 'image/jpeg', base64Data: null };
  }
  return { mimeType, base64Data };
}

function extractJson(raw: string): { title?: string; content?: string } | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const title =
      (parsed.title ?? parsed.Title ?? parsed.headline ?? parsed.Headline) as string | undefined;
    const content =
      (parsed.content ?? parsed.Content ?? parsed.body ?? parsed.Body) as string | undefined;
    return typeof title === 'string' && typeof content === 'string' ? { title, content } : null;
  } catch {
    return null;
  }
}
