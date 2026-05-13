import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Deadline = {
  id: string;
  subject: string;
  task: string;
  dueDate: string;
  type?: string;
};

type UserProfile = {
  name: string;
  hoursPerDay: number;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  unavailableDays: string[];
  deadlines: Deadline[];
};

type FileAttachment = {
  name: string;
  data: string;
  mimeType: string;
};

function buildSystemPrompt(profile: UserProfile | null): string {
  const base = profile
    ? (() => {
        const today = new Date().toDateString();
        const active = profile.deadlines
          .filter((d) => new Date(d.dueDate) >= new Date(today))
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        const deadlineList = active
          .map((d, i) => {
            const days = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
            const when =
              days === 0 ? 'Due TODAY' : days === 1 ? 'Due tomorrow' : `Due in ${days} days (${d.dueDate})`;
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
      })()
    : `You are DeadlineAI, an expert anti-procrastination study assistant for university students embedded in a study planner app.
Your role: help students manage time, beat procrastination, and stay on track.
Be concise, encouraging, and practical. Use **bold** for emphasis and bullet points for lists.`;

  return (
    base +
    `

EXAM & DEADLINE STUDY PLAN FLOW:
When a student mentions an upcoming exam, test, quiz, or important assignment that you don't already have full details about, proactively gather information by asking ONE question at a time in this order:
1. "What subjects or topics will this cover?"
2. "What format is it? (e.g. multiple choice, essay, practical, open book)"
3. "On a scale of 1–10, how comfortable are you with the material right now?"
4. "Are there any specific areas you're finding difficult?"
After you have all four answers, generate a detailed day-by-day study plan. Then, on a NEW LINE at the very end of your response (after all your text), emit:
[DEADLINE_ACTION:{"subject":"SUBJECT","task":"TASK NAME","dueDate":"YYYY-MM-DD","type":"exam"}]

Ask questions conversationally, one at a time. Do not ask all four at once.
If a file is attached, analyze it thoroughly and extract key information.

DEADLINE ACTION MARKER:
Whenever you have clearly identified all three of: a specific subject, a specific task/exam name, AND a specific due date — emit this marker on a new line at the very END of your response (after all your text):
[DEADLINE_ACTION:{"subject":"SUBJECT","task":"TASK NAME","dueDate":"YYYY-MM-DD","type":"exam|assignment|project|other"}]
Only emit this once per response. Only emit it when you have all three pieces of information. Use ISO date format (YYYY-MM-DD) for the due date.

RESOURCE SEARCH:
When a student explicitly asks for study resources, YouTube videos, revision materials, or external links to learn from, emit this marker at the very END of your response (after all your text):
[SEARCH:"your search query"]
For example: if asked for "calculus revision videos", emit [SEARCH:"calculus integration differentiation tutorial for students"]
Only emit one search marker per response. Do not emit this for general questions — only when they specifically want external resources or links.`
  );
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile, fileAttachment } = (await req.json()) as {
      messages: { role: string; content: string }[];
      userProfile: UserProfile | null;
      fileAttachment: FileAttachment | null;
    };

    const systemPrompt = buildSystemPrompt(userProfile ?? null);

    // Build Claude messages — modify the last user message if a file is attached
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

    type ClaudeMessage = {
      role: string;
      content: string | ContentBlock[];
    };

    const claudeMessages: ClaudeMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (fileAttachment && claudeMessages.length > 0) {
      const last = claudeMessages[claudeMessages.length - 1];
      if (last.role === 'user') {
        const isImage =
          fileAttachment.mimeType === 'image/jpeg' || fileAttachment.mimeType === 'image/png';
        const isPdf = fileAttachment.mimeType === 'application/pdf';

        if (isImage || isPdf) {
          const fileBlock: ContentBlock = isImage
            ? {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: fileAttachment.mimeType,
                  data: fileAttachment.data,
                },
              }
            : {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: fileAttachment.data,
                },
              };

          claudeMessages[claudeMessages.length - 1] = {
            role: 'user',
            content: [
              fileBlock,
              {
                type: 'text',
                text: typeof last.content === 'string' && last.content.trim()
                  ? last.content
                  : 'Please analyze this file and tell me what you see.',
              },
            ],
          };
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages as any,
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        let errored = false;
        stream.on('text', (text) => {
          controller.enqueue(encoder.encode(text));
        });
        stream.on('error', (err) => {
          console.error('[chat route] stream error:', err);
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
    console.error('[chat route] error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
