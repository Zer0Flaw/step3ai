import OpenAI from "openai";

export function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export const STEP_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing video transcripts and extracting clear, actionable step-by-step instructions.

Given a video transcript, extract:
1. A concise title for the process/procedure
2. A brief description (1-2 sentences)
3. Organized sections (if the content has natural phases)
4. Numbered steps under each section
5. A flat checklist of all key action items

Rules:
- Steps should be clear, actionable, and specific
- Use active verbs (Click, Enter, Select, Navigate, etc.)
- Group related steps into logical sections
- Each step should be a single action
- Include important warnings or notes as step annotations
- Extract 5-30 steps depending on content complexity
- Sections should have 2-8 steps each

Respond with valid JSON matching this exact structure:
{
  "title": "string",
  "description": "string",
  "estimated_time": "string (e.g. '5-10 minutes')",
  "sections": [
    {
      "title": "string",
      "steps": [
        {
          "order": number,
          "title": "string (short action title)",
          "description": "string (detailed explanation)",
          "note": "string | null (warning or tip)"
        }
      ]
    }
  ],
  "checklist": [
    {
      "item": "string",
      "section": "string"
    }
  ]
}`;

export async function extractStepsFromTranscript(transcript: string) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: STEP_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the video transcript:\n\n${transcript}\n\nExtract structured steps from this transcript.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content from OpenAI");
  return JSON.parse(content) as ExtractedManual;
}

export interface ExtractedStep {
  order: number;
  title: string;
  description: string;
  note: string | null;
}

export interface ExtractedSection {
  title: string;
  steps: ExtractedStep[];
}

export interface ChecklistItem {
  item: string;
  section: string;
}

export interface ExtractedManual {
  title: string;
  description: string;
  estimated_time: string;
  sections: ExtractedSection[];
  checklist: ChecklistItem[];
}
