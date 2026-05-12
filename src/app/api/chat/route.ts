import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log('[chat route] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);

type Deadline = {
  id: string;
  subject: string;
  task: string;
  dueDate: string;
};

type UserProfile = {
  name: string;
  hoursPerDay: number;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  unavailableDays: string[];
  deadlines: Deadline[];
};

function buildSystemPrompt(profile: UserProfile | null): string {
  if (!profile) {
    return `You are DeadlineAI, an expert anti-procrastination study assistant for university students embedded in a study planner app.
Your role: help students manage time, beat procrastination, and stay on track.
Be concise, encouraging, and practical. Use **bold** for emphasis and bullet points for lists.`;
  }

  const today = new Date().toDateString();
  const active = profile.deadlines
    .filter((d) => new Date(d.dueDate) >= new Date(today))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const deadlineList = active
    .map((d, i) => {
      const days = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
      const when = days === 0 ? 'Due TODAY' : days === 1 ? 'Due tomorrow' : `Due in ${days} days (${d.dueDate})`;
      return `${i + 1}. ${d.task} (${d.subject}) — ${when}`;
    })
    .join('\n');

  return `You are DeadlineAI, an expert anti-procrastination study assistant for university students. You are embedded in a study planner app.

Student profile:
- Name: ${profile.name}
- Daily study goal: ${profile.hoursPerDay} hours/day
- Preferred study time: ${profile.preferredTime}
- Unavailable days: ${profile.unavailableDays.length > 0 ? profile.unavailableDays.join(', ') : 'None'}

Upcoming deadlines (most urgent first):
${deadlineList || 'No deadlines currently added.'}

Your role:
- Help ${profile.name} manage time, beat procrastination, and stay on track
- Give specific, actionable advice referencing their actual deadlines and schedule
- Be concise, encouraging, and practical — never preachy
- Use **bold** for emphasis and bullet points for lists
- Suggest study techniques (Pomodoro, spaced repetition, active recall) when relevant
- If asked to create a plan or schedule, be specific with times and tasks based on their ${profile.hoursPerDay}h/day goal and ${profile.preferredTime} preference`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json();

    const systemPrompt = buildSystemPrompt(userProfile ?? null);

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
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
