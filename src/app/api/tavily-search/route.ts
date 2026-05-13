import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };

    if (!query?.trim()) {
      return Response.json({ results: [] });
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query.trim(),
        max_results: 5,
        search_depth: 'basic',
      }),
    });

    if (!res.ok) {
      return Response.json({ results: [] });
    }

    const data = await res.json();

    const results = (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      description: r.content?.slice(0, 200) ?? '',
      source: new URL(r.url).hostname.replace('www.', ''),
    }));

    return Response.json({ results });
  } catch {
    return Response.json({ results: [] });
  }
}
