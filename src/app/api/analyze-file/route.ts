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
          source: {
            type: 'base64' as const,
            media_type: mimeType as 'image/jpeg' | 'image/png',
            data: fileData,
          },
        })
      : ({
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: fileData,
          },
        });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: `You are an academic schedule analyzer. Extract deadlines, assignments, exams, and study tasks from academic documents such as timetables, syllabi, curricula, and homework schedules.

Respond with ONLY valid JSON — no markdown, no prose before or after. Match this exact schema:
{
  "summary": "One sentence describing what was found in the document",
  "subjects": ["subject1", "subject2"],
  "extractedDeadlines": [
    {
      "subject": "Subject name",
      "task": "Specific task or assignment name",
      "dueDate": "YYYY-MM-DD",
      "estimatedHours": 3
    }
  ]
}

Rules:
- Only include items with a clearly implied or stated due date
- Format all dates as YYYY-MM-DD; if the year is missing assume 2026
- estimatedHours: 1–20 based on task complexity (exam = 8–15, essay = 4–10, homework = 1–4)
- task must be specific (e.g. "Chapter 3 Lab Report" not just "Lab Report")
- If nothing is found, return an empty extractedDeadlines array`,
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
              text: `File: ${fileName}\n\nAnalyze this document and extract all deadlines, assignments, and study tasks as JSON.`,
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
