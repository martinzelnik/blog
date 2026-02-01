import { NextRequest, NextResponse } from 'next/server';
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
Piš výhradně česky.`
      : `You are a blog post assistant. Based on the image, generate a short blog post.
Return a JSON object with keys "title" (headline, max 80 chars) and "content" (body, 2-4 paragraphs).
Write in English only.`;

  const userPrompt =
    lang === 'cs'
      ? 'Analyzuj tento obrázek a vygeneruj blogový příspěvek. Vrať pouze platný JSON.'
      : 'Analyze this image and generate a blog post. Return only valid JSON.';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', response.status, err);
      return NextResponse.json(
        { error: 'Failed to generate content from image' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
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
  } catch (err) {
    console.error('POST /api/ai/generate-post:', err);
    return NextResponse.json(
      { error: 'Failed to generate post content' },
      { status: 500 }
    );
  }
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string | null } {
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
  if (!match) return { mimeType: 'image/jpeg', base64Data: null };
  return { mimeType: match[1], base64Data: match[2] || null };
}

function extractJson(raw: string): { title?: string; content?: string } | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as { title?: string; content?: string };
  } catch {
    return null;
  }
}
