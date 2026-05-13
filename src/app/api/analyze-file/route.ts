import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ExtractedDeadline = {
  subject: string;
  task: string;
  dueDate: string;
  estimatedHours?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { fileData, mimeType, fileName } = await req.json();

    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png';
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const fileContent = isImage
      ? ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: mimeType as 'image/jpeg' | 'image/png', data: fileData },
        })
      : ({
          type: 'document' as const,
          source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: fileData },
        });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8096,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: `You are an academic schedule extractor. Your job is to extract EVERY single academic item from the document — do NOT filter, skip, or summarize.

Extract ALL of the following if present: assignments, essays, reports, labs, projects, presentations, exams, tests, quizzes, readings, tutorials, lectures, workshops, problem sets, homework, coursework, revision tasks, and any other academic activity.

Do NOT filter by whether something has an explicit due date. Include EVERYTHING. The student will decide what to keep.

For due dates:
- Use the exact date if clearly stated
- Infer from context when possible (e.g. "Week 3" → estimate the date, "before midterm" → reasonable estimate)
- If no date at all can be inferred, use 2026-07-01 as a placeholder — the student can edit it
- Format ALL dates as YYYY-MM-DD; assume year 2026 if not stated

Respond with ONLY valid JSON — no markdown, no prose. Match this exact schema:
{
  "summary": "One sentence describing the document",
  "subjects": ["subject1", "subject2"],
  "extractedDeadlines": [
    {
      "subject": "Course or subject name",
      "task": "Specific item name (be descriptive)",
      "dueDate": "YYYY-MM-DD",
      "estimatedHours": 3
    }
  ]
}

estimatedHours: 1–20 based on task complexity (exam = 8–15, essay = 4–10, lab = 2–6, homework = 1–4, reading = 1–3).
task: be as specific as possible using the exact wording from the document.
Include EVERY item you find — err on the side of including too much rather than too little.`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            fileContent,
            {
              type: 'text',
              text: `File: ${fileName}\n\nExtract EVERY academic item from this document as JSON. Include everything — do not filter anything out.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    const raw = textBlock.text.trim();
    const jsonStr = raw.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');

    let parsed: { summary: string; subjects: string[]; extractedDeadlines: ExtractedDeadline[] };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('[analyze-file] JSON parse failed:', raw.slice(0, 300));
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[analyze-file] Error:', err);
    return NextResponse.json({ error: 'Failed to analyze file' }, { status: 500 });
  }
}
