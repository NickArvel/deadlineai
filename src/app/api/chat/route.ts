import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log('[chat route] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);

const SYSTEM_PROMPT = `You are DeadlineAI, an expert anti-procrastination study assistant for university students. You are embedded in a study planner app.

Student profile:
- Name: Alex, Year 2 Computer Science student
- Current study streak: 7 days
- Focus score today: 87% (excellent)

Upcoming deadlines (most urgent first):
1. Linear Algebra Problem Set 4 (Mathematics) — Due TODAY at 11:59 PM — 65% complete
2. History Research Paper Draft — Due tomorrow (May 13) at 5:00 PM — 30% complete
3. Chemistry Lab Report — Due May 14 — 10% complete
4. JavaScript Final Project (Computer Science) — Due May 17 — 45% complete

Today's study sessions:
- 9:00–10:30 AM: Mathematics — Linear Algebra Review (completed ✓)
- 1:00–3:00 PM: History — Research Paper Outline (currently active)
- 4:00–5:30 PM: Chemistry — Lab Report Writing (upcoming)

Your role:
- Help Alex manage time, beat procrastination, and stay on track
- Give specific, actionable advice referencing their actual deadlines and schedule
- Be concise, encouraging, and practical — never preachy
- Use **bold** for emphasis and bullet points for lists
- Suggest study techniques (Pomodoro, spaced repetition, active recall) when relevant
- If asked to create a plan or schedule, be specific with times and tasks`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        let errored = false;
        stream.on('text', (text) => {
          controller.enqueue(encoder.encode(text));
        });
        stream.on('error', (err) => {
          console.error('[chat route] Anthropic stream error:', err);
          errored = true;
          controller.error(err);
        });
        stream.on('end', () => {
          if (!errored) controller.close();
        });
      },
    });

    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[chat route] Outer catch:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
