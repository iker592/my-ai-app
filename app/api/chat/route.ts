import { anthropic } from '@ai-sdk/anthropic';
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

import { readFile } from 'fs/promises';
import { join } from 'path';

export const maxDuration = 30;

// Load resume content once when the module loads
let resumeContent: string | null = null;

async function loadResume(): Promise<string> {
  if (!resumeContent) {
    const resumePath = join(process.cwd(), 'RESUME.md');
    resumeContent = await readFile(resumePath, 'utf-8');
  }
  return resumeContent;
}

const resume = await loadResume();

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    messages: convertToModelMessages(messages),
    tools: {
      getResumeInfo: tool({
        description: 'Search and retrieve information from the resume. ' +
        'Use this tool to answer questions about the person, their experience, skills, ' +
        'education, projects, or any other information from the resume.',
        inputSchema: z.object({
          query: z.string().describe('The question or topic to search for in the resume'),
        }),
        execute: async ({ query }) => {
          return {
            resume: resume,
            query: query,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}