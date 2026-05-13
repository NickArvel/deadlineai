import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { subject, task, dueDate, studyPlan, topics } = (await req.json()) as {
      subject: string;
      task: string;
      dueDate: string;
      studyPlan?: string;
      topics?: string;
    };

    const contextSection = [
      studyPlan ? `Study Plan:\n${studyPlan}` : '',
      topics ? `Topics:\n${topics}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const prompt = `Generate study resources for a student preparing for the following:

Subject: ${subject}
Task: ${task}
Due Date: ${dueDate}
${contextSection}

Return ONLY a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "flashcards": [
    {"question": "...", "answer": "..."}
  ],
  "mockQuestions": [
    {"question": "...", "answer": "...", "explanation": "..."}
  ]
}

Requirements:
- Generate 8-12 flashcards covering key definitions, concepts, and facts from the subject/topics
- Generate 5-8 practice questions that test understanding (not just memorization)
- Flashcard answers should be concise (1-3 sentences)
- Mock question answers should be thorough with explanations
- Base content on the study plan and topics if provided, otherwise use your knowledge of the subject`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    let flashcards: { question: string; answer: string }[] = [];
    let mockQuestions: { question: string; answer: string; explanation?: string }[] = [];

    try {
      const parsed = JSON.parse(rawText.trim());
      flashcards = parsed.flashcards ?? [];
      mockQuestions = parsed.mockQuestions ?? [];
    } catch {
      // Try to extract JSON from the text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          flashcards = parsed.flashcards ?? [];
          mockQuestions = parsed.mockQuestions ?? [];
        } catch { /* give up */ }
      }
    }

    // Fetch YouTube links via Tavily
    let youtubeLinks: { title: string; url: string; description: string }[] = [];
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${subject} ${task} study tutorial`,
          max_results: 5,
          include_domains: ['youtube.com'],
        }),
      });

      if (tavilyRes.ok) {
        const tavilyData = await tavilyRes.json();
        youtubeLinks = (tavilyData.results ?? []).map(
          (r: { title: string; url: string; content: string }) => ({
            title: r.title,
            url: r.url,
            description: r.content?.slice(0, 150) ?? '',
          }),
        );
      }
    } catch { /* ignore */ }

    return Response.json({ flashcards, mockQuestions, youtubeLinks });
  } catch (err) {
    console.error('[generate-resources] error:', err);
    return Response.json({ flashcards: [], mockQuestions: [], youtubeLinks: [] }, { status: 500 });
  }
}
