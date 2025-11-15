import { anthropic } from '@ai-sdk/anthropic';
import { streamText, generateText, UIMessage, convertToModelMessages, tool, CoreMessage } from 'ai';
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
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  let modelMessages: CoreMessage[] = convertToModelMessages(messages) as CoreMessage[];

  // Execute tool calls if needed
  const firstResult = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: 'You are a helpful assistant that answers questions about a resume. ' +
    'When you call the getResumeInfo tool, analyze the resume content and provide a helpful answer to the user\'s question based on the resume information.',
    messages: modelMessages,
    tools: {
      getResumeInfo: resumeTool,
    },
  });

  modelMessages.push(...firstResult.response.messages);

  // Continue loop if tool was called but no text response yet
  if (firstResult.toolCalls?.length > 0 && !firstResult.text) {
    const finalResult = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: 'You are a helpful assistant that answers questions about a resume. ' +
      'When you call the getResumeInfo tool, analyze the resume content and provide a helpful answer to the user\'s question based on the resume information.',
      messages: modelMessages,
    });
    modelMessages.push(...finalResult.response.messages);
  }

  // Stream response (remove last message so it's regenerated and streamed)
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: 'You are a helpful assistant that answers questions about a resume. ' +
    'When you call the getResumeInfo tool, analyze the resume content and provide a helpful answer to the user\'s question based on the resume information.',
    messages: modelMessages.slice(0, -1),
    tools: {
      getResumeInfo: resumeTool,
    },
  });

  return result.toUIMessageStreamResponse();
}