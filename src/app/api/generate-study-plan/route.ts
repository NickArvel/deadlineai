import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { subject, task, dueDate, topics, format, comfort, struggling, hoursPerDay } =
      await req.json();

    const today = new Date().toISOString().split('T')[0];
    const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);

    const prompt = `Create a detailed, day-by-day personalised study plan for this exam:

Subject: ${subject}
Exam/Task: ${task}
Due date: ${dueDate} (${daysLeft > 0 ? `${daysLeft} days from today` : 'today'}, today is ${today})
Topics covered: ${topics}
Exam format: ${format}
Comfort level: ${comfort}/10
Struggling with: ${struggling?.trim() || 'Nothing specific mentioned'}
Daily study hours available: ${hoursPerDay || 2}

Generate a specific day-by-day study plan that:
- Covers all topics listed, allocating more time to lower-confidence areas
- Uses study techniques matched to the exam format (e.g. practice questions for MC, essay plans for essays, hands-on practice for practicals)
- Includes built-in review sessions and a light revision day before the exam
- Gives realistic time estimates per topic based on the comfort level
- Is encouraging and actionable

Format with **Day 1 — [Date]:** headings and bullet points for tasks under each day.`;

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system:
        'You are an expert academic study planner. Create clear, specific, motivating study plans. Use **bold** for day headings and bullet points for daily tasks. Be practical and encouraging.',
      messages: [{ role: 'user', content: prompt }],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        let errored = false;
        stream.on('text', (text) => controller.enqueue(encoder.encode(text)));
        stream.on('error', (err) => {
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
    console.error('[generate-study-plan] error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
