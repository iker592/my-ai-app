import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
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

const resumeTool = tool({
  description: 'Get the complete resume content. After calling this tool, you MUST analyze ' +
  'the resume and provide a helpful text response to answer the user\'s question.',
  inputSchema: z.object({
    query: z.string().describe('What the user wants to know about the resume'),
  }),
  execute: async ({ query }) => {
    // Return the resume content for Claude to analyze
    return {
      content: resume,
      instruction: `Please analyze this resume and answer the user's question: "${query}"`,
    };
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // streamText with stopWhen enables multi-step agent loop:
  // Default stopWhen is stepCountIs(1) which only allows tool calls without text
  // Use higher stepCountIs to allow tool call + text generation
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: 'You are a helpful assistant that answers questions about a professional resume. ' +
    'Use the getResumeInfo tool to retrieve the resume content, then analyze it carefully ' +
    'to provide detailed, helpful answers to user questions. Be concise and focus on relevant details.',
    messages: convertToModelMessages(messages),
    tools: {
      getResumeInfo: resumeTool,
    },
    stopWhen: stepCountIs(5), // Allow multiple steps: tool calls + text generation
  });

  return result.toUIMessageStreamResponse();
}