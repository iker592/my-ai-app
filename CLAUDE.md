# CLAUDE.md - AI Assistant Guide

**Last Updated:** 2025-11-22
**Project:** my-ai-app
**Version:** 0.1.0
**Status:** Living documentation - updated as codebase evolves

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Key Files & Their Purposes](#key-files--their-purposes)
5. [Development Workflow](#development-workflow)
6. [Architecture & Design Patterns](#architecture--design-patterns)
7. [Code Conventions](#code-conventions)
8. [API Documentation](#api-documentation)
9. [Frontend Architecture](#frontend-architecture)
10. [State Management](#state-management)
11. [Styling Guidelines](#styling-guidelines)
12. [Common Development Tasks](#common-development-tasks)
13. [Important Notes & Caveats](#important-notes--caveats)

---

## Project Overview

### Purpose
A **resume-based AI chat assistant** that enables users to ask questions about a professional resume using Claude AI. The application loads a resume from markdown, provides it to Claude via a tool interface, and streams intelligent responses back to users in real-time.

### Current Status
**⚠️ TEMPORARILY DISABLED** - The site currently displays a "Site Temporarily Down" banner and the chat interface is non-functional. All backend logic remains intact.

### Core Features
- AI-powered resume Q&A using Anthropic Claude Haiku 4.5
- Real-time streaming responses
- Markdown rendering for formatted AI responses
- Tool-based resume information retrieval
- Dark mode support
- Mobile-responsive design

---

## Codebase Structure

```
/home/user/my-ai-app/
├── app/                           # Next.js App Router (React Server Components)
│   ├── api/                       # Backend API routes
│   │   └── chat/
│   │       └── route.ts          # POST /api/chat - AI chat endpoint
│   ├── globals.css               # Global styles + Tailwind base
│   ├── layout.tsx                # Root layout with fonts & metadata
│   ├── page.tsx                  # Main chat UI (client component)
│   └── favicon.ico               # App icon
│
├── public/                        # Static assets (served directly)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── RESUME.md                      # Resume content (loaded by API)
├── SYSTEM_PROMPT.md              # System prompt placeholder
├── IkerRedondoResume.pdf         # PDF version of resume
├── README.md                      # Standard Next.js readme
│
├── package.json                   # Dependencies & scripts
├── pnpm-lock.yaml                # Lock file (using pnpm)
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
└── .gitignore                    # Git ignore rules
```

### Directory Purposes

| Directory | Purpose | Notes |
|-----------|---------|-------|
| `/app` | Next.js App Router directory | All routes, layouts, and pages |
| `/app/api` | Backend API endpoints | RESTful routes using Next.js route handlers |
| `/public` | Static assets | Served directly at `/` URL path |
| `.git` | Version control | Repository history and branches |

---

## Technology Stack

### Frontend Stack
```json
{
  "framework": "Next.js 16.0.1 (App Router)",
  "ui-library": "React 19.2.0",
  "styling": "Tailwind CSS 4",
  "markdown": "react-markdown 10.1.0",
  "fonts": "Geist (Sans & Mono) via next/font"
}
```

### Backend Stack
```json
{
  "runtime": "Next.js API Routes (Node.js)",
  "ai-provider": "@ai-sdk/anthropic 2.0.38",
  "ai-framework": "Vercel AI SDK 5.0.81",
  "validation": "Zod 4.1.12",
  "model": "Claude Haiku 4.5 (claude-haiku-4-5-20251001)"
}
```

### Development Tools
```json
{
  "language": "TypeScript 5",
  "linter": "ESLint 9 with eslint-config-next",
  "package-manager": "pnpm",
  "css-processing": "PostCSS with Tailwind"
}
```

### Optional Dependencies (Included but Unused)
- `@ai-sdk/openai` - OpenAI integration (not currently used)

---

## Key Files & Their Purposes

### Frontend Files

#### `/app/page.tsx` (Main Chat UI)
**Line Count:** ~90 lines
**Type:** Client Component (`'use client'`)
**Purpose:** Primary chat interface

**Key Responsibilities:**
- Renders chat messages with role-based styling (user/assistant)
- Integrates `useChat` hook from `@ai-sdk/react` for message management
- Implements auto-scroll to bottom on new messages
- Renders markdown for assistant responses using ReactMarkdown
- Displays tool call results as formatted JSON
- **Currently disabled** with "Site Temporarily Down" banner

**Important Implementation Details:**
```typescript
// Message display pattern
messages.map(message => (
  // User messages: plain text
  // Assistant messages: ReactMarkdown with custom components
  // Tool results: JSON.stringify with pretty printing
))

// Auto-scroll implementation
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages, isLoading])
```

**Custom Markdown Styling:**
- Headings: h1 (2xl), h2 (xl), h3 (lg) with bold + spacing
- Lists: ul (disc), ol (decimal) with indentation
- Code: inline (gray bg) and blocks (pre with gray bg)
- Text: paragraphs with margin-bottom spacing

#### `/app/layout.tsx` (Root Layout)
**Line Count:** ~25 lines
**Type:** Server Component (default)
**Purpose:** Application-wide layout wrapper

**Responsibilities:**
- Loads Google Fonts (Geist Sans + Geist Mono)
- Sets HTML metadata (title, description)
- Applies font CSS variables to body element
- Provides consistent layout structure

**Metadata:**
```typescript
{
  title: "Create Next App",
  description: "Generated by create next app"
}
```

#### `/app/globals.css` (Global Styles)
**Line Count:** ~27KB
**Purpose:** Global stylesheet with Tailwind base

**Contains:**
- CSS custom properties for theming
- Color scheme definitions (light/dark)
- Font family configuration
- Tailwind directives (@tailwind base, components, utilities)

**Color Variables:**
```css
/* Light Mode */
--background: #ffffff;
--foreground: #171717;

/* Dark Mode */
--background: #0a0a0a;
--foreground: #ededed;
```

### Backend Files

#### `/app/api/chat/route.ts` (Chat API Endpoint)
**Line Count:** 79 lines
**Type:** API Route Handler
**Purpose:** Process chat requests and stream AI responses

**Architecture Overview:**
```
POST Request → Load Resume → Convert Messages →
Generate Text (Tool Call) → Stream Response → Return
```

**Three-Phase Response Generation:**
1. **Phase 1:** Initial `generateText()` with tool calling enabled
2. **Phase 2:** Follow-up `generateText()` if tools were called but no text was generated
3. **Phase 3:** `streamText()` to stream final response to client

**Key Implementation:**
```typescript
// Module-level resume caching
let resumeContent: string | null = null;

// Resume loaded once at module initialization
const resume = await loadResume();

// Tool definition
const resumeTool = tool({
  description: 'Search and retrieve information from the resume...',
  inputSchema: z.object({
    query: z.string().describe('The question or topic to search for')
  }),
  execute: async ({ query }) => ({
    resume: resume,
    query: query
  })
});
```

**System Prompt:**
```
"You are a helpful assistant that answers questions about a resume.
When you call the getResumeInfo tool, analyze the resume content and
provide a helpful answer to the user's question based on the resume
information."
```

**Configuration:**
- Max duration: 30 seconds
- Model: `claude-haiku-4-5-20251001`
- Tool: `getResumeInfo` (Zod-validated)

**Request Format:**
```typescript
interface Request {
  messages: UIMessage[]  // Array of user/assistant messages
}
```

**Response Format:**
```typescript
// Streaming response via toUIMessageStreamResponse()
// Compatible with @ai-sdk/react useChat hook
```

### Content Files

#### `/RESUME.md` (Resume Content)
**Line Count:** ~100 lines
**Purpose:** Source of truth for resume information

**Contents:**
- Personal information (Iker Redondo, Software Engineer II)
- Professional experience (Yahoo 2020-Present, Desert Star Systems 2018)
- Technical skills (Python, AI Agents, LangGraph, Java, React, AWS, etc.)
- Education (Computer Science degrees)
- Projects and achievements

**Loading Pattern:**
```typescript
// Loaded once at module initialization
// Cached in module-level variable
// Included in every tool call response
```

#### `/SYSTEM_PROMPT.md` (System Prompt)
**Line Count:** 2 lines
**Status:** Placeholder file
**Purpose:** Reserved for system prompt customization

#### `/IkerRedondoResume.pdf` (PDF Resume)
**Size:** 136KB
**Purpose:** Downloadable PDF version of resume

### Configuration Files

#### `/tsconfig.json` (TypeScript Configuration)
**Key Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]  // Path alias for imports
    }
  }
}
```

#### `/package.json` (Dependencies & Scripts)
**Scripts:**
```bash
pnpm dev      # Start development server (port 3000)
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

**Key Dependencies:**
- `@ai-sdk/anthropic` - Claude AI integration
- `@ai-sdk/react` - React hooks for AI SDK
- `ai` - Vercel AI SDK core
- `next` - Next.js framework
- `react` + `react-dom` - React library
- `react-markdown` - Markdown rendering
- `zod` - Schema validation

#### `/next.config.ts` (Next.js Configuration)
**Status:** Minimal default configuration
**No special overrides or customizations**

#### `/eslint.config.mjs` (Linting Configuration)
**Extends:** `eslint-config-next`
**Ignores:** `.next/`, `out/`, `build/`, `next-env.d.ts`

---

## Development Workflow

### Package Manager
**Use `pnpm` for all package operations** (evidenced by `pnpm-lock.yaml`)

### Development Server
```bash
pnpm dev
# Opens on http://localhost:3000
# Hot reload enabled
# Fast refresh for React components
```

### Build Process
```bash
pnpm build     # Creates production build in .next/
pnpm start     # Serves production build
```

### Linting
```bash
pnpm lint      # Runs ESLint with Next.js config
```

### Git Workflow
**Current Branch:** `claude/claude-md-miapb1j4foabmmjc-01UXGhVRbLBWnRFCK7unpyto`
**Pattern:** Development happens on feature branches

**Recent Commits (as of 2025-11-22):**
```
2a19d9b - temporarily down
a08429d - update resume
5c30cf6 - render md and scroll to bottom
ac5fc47 - adding resume to agent
1d4a04a - change tool to resume
```

### Deployment
**Recommended:** Vercel Platform (Next.js creators)
**See:** [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)

---

## Architecture & Design Patterns

### Application Architecture
```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
│  ┌──────────────────────────────────────────┐  │
│  │  React Client Component (page.tsx)       │  │
│  │  - useChat hook                          │  │
│  │  - Message rendering                     │  │
│  │  - User input handling                   │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼───────────────────────────────┘
                  │ HTTP POST /api/chat
                  ▼
┌─────────────────────────────────────────────────┐
│              Next.js Server                      │
│  ┌──────────────────────────────────────────┐  │
│  │  API Route Handler (route.ts)            │  │
│  │  1. Load resume (cached)                 │  │
│  │  2. Convert UI messages to core messages │  │
│  │  3. Call Claude with tool                │  │
│  │  4. Stream response                      │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Anthropic Claude API                   │
│  Model: claude-haiku-4-5-20251001               │
│  Tool: getResumeInfo                            │
└─────────────────────────────────────────────────┘
```

### Design Patterns

#### 1. Server-Side Caching
```typescript
// Module-level caching for resume content
let resumeContent: string | null = null;

async function loadResume(): Promise<string> {
  if (!resumeContent) {
    const resumePath = join(process.cwd(), 'RESUME.md');
    resumeContent = await readFile(resumePath, 'utf-8');
  }
  return resumeContent;
}

// Loaded once at module initialization
const resume = await loadResume();
```

**Benefits:**
- Resume loaded only once per server start
- Reduces file I/O operations
- Improves response time

#### 2. Tool-Based AI Interaction
```typescript
// Structured tool definition with Zod validation
const resumeTool = tool({
  description: '...',
  inputSchema: z.object({
    query: z.string().describe('...')
  }),
  execute: async ({ query }) => ({ ... })
});
```

**Benefits:**
- Type-safe tool parameters
- Runtime validation
- Structured data exchange with AI
- Clear tool interface

#### 3. Three-Phase Response Generation
```typescript
// Phase 1: Initial generation with tools
const firstResult = await generateText({ tools: { getResumeInfo } });

// Phase 2: Follow-up if tools called but no text
if (firstResult.toolCalls?.length > 0 && !firstResult.text) {
  const finalResult = await generateText({ ... });
}

// Phase 3: Stream final response
return streamText({ ... }).toUIMessageStreamResponse();
```

**Purpose:** Ensures Claude can call tools, process results, and generate a text response in a multi-turn flow.

#### 4. Message Conversion Pipeline
```typescript
// UI messages → Core messages → AI model
const modelMessages: CoreMessage[] = convertToModelMessages(messages);
```

**Purpose:** Converts `@ai-sdk/react` UI message format to AI SDK core message format for model consumption.

#### 5. Component-Based Markdown Rendering
```typescript
<ReactMarkdown
  components={{
    h1: ({node, ...props}) => <h1 className="..." {...props} />,
    h2: ({node, ...props}) => <h2 className="..." {...props} />,
    // ... custom components for each element type
  }}
>
  {text}
</ReactMarkdown>
```

**Benefits:**
- Consistent styling across markdown elements
- Full control over rendered output
- Integration with Tailwind CSS

#### 6. Client-Side State Management via Hooks
```typescript
// useChat hook provides complete chat state
const { messages, sendMessage, isLoading } = useChat();

// Local state for form input
const [input, setInput] = useState('');

// Refs for DOM manipulation
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**Pattern:** React Hooks for all state management (no external state library needed).

---

## Code Conventions

### File Naming
- **Components:** PascalCase (e.g., `Chat`, `Layout`)
- **API Routes:** lowercase with kebab-case folders (e.g., `api/chat/route.ts`)
- **Config Files:** lowercase with extensions (e.g., `next.config.ts`)
- **Content Files:** UPPERCASE for documentation (e.g., `RESUME.md`, `CLAUDE.md`)

### Import Organization
```typescript
// 1. External dependencies
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';
import { z } from 'zod';

// 2. Node.js built-ins
import { readFile } from 'fs/promises';
import { join } from 'path';

// 3. Internal imports (if any)
// import { helper } from '@/lib/helper';
```

### Component Structure
```typescript
'use client';  // Directive at top if client component

// Imports
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

// Component definition
export default function ComponentName() {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => { ... }, []);

  // 3. Event handlers
  const handleSubmit = () => { ... };

  // 4. Render
  return (
    <div>...</div>
  );
}
```

### API Route Structure
```typescript
// Imports
import { ... } from '...';

// Configuration exports
export const maxDuration = 30;

// Module-level initialization
const data = await loadData();

// Route handler export
export async function POST(req: Request) {
  // 1. Parse request
  const body = await req.json();

  // 2. Process
  const result = await process(body);

  // 3. Return response
  return result.toResponse();
}
```

### TypeScript Conventions
- **Strict mode enabled** - All type safety features enforced
- **Explicit typing** for function parameters and returns
- **Interface/Type definitions** for complex objects
- **Zod schemas** for runtime validation

### CSS/Styling Conventions
- **Tailwind utility classes** - Primary styling method
- **Dark mode variants** - Use `dark:` prefix for dark mode styles
- **Responsive design** - Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Semantic class names** - For custom CSS when needed

---

## API Documentation

### POST /api/chat

**Endpoint:** `/api/chat`
**File:** `/app/api/chat/route.ts`
**Method:** POST
**Max Duration:** 30 seconds

#### Request Format
```typescript
{
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "parts": [
        { "type": "text", "text": "What are Iker's skills?" }
      ]
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "parts": [
        { "type": "text", "text": "Based on the resume..." }
      ]
    }
  ]
}
```

#### Response Format
**Type:** Streaming response via `toUIMessageStreamResponse()`
**Compatible with:** `@ai-sdk/react` `useChat` hook

**Response Structure:**
```typescript
// Streamed chunks of:
{
  id: "msg-3",
  role: "assistant",
  parts: [
    { type: "text", text: "Streaming text..." },
    { type: "tool-getResumeInfo", result: {...} }  // If tool was called
  ]
}
```

#### Tool: getResumeInfo

**Description:** Search and retrieve information from the resume

**Input Schema:**
```typescript
{
  query: string  // The question or topic to search for in the resume
}
```

**Output:**
```typescript
{
  resume: string,  // Full resume markdown content
  query: string    // The original query
}
```

**Example Usage:**
```typescript
// Claude automatically calls this tool when needed
// Input: "What are Iker's skills?"
// Tool Call: { query: "What are Iker's skills?" }
// Tool Result: { resume: "...", query: "..." }
// Claude Response: "Based on the resume, Iker has the following skills:..."
```

#### Error Handling
- **Timeout:** 30 second max duration enforced by Next.js
- **File Read Errors:** Resume must exist at `/RESUME.md`
- **AI Errors:** Propagated from Anthropic API

#### Authentication
**None** - Currently no authentication implemented

---

## Frontend Architecture

### Component Hierarchy
```
RootLayout (layout.tsx) - Server Component
└── Chat (page.tsx) - Client Component
    ├── Banner - "Site Temporarily Down"
    ├── Messages Container - Scrollable area
    │   ├── Message Loop
    │   │   ├── Role Header (User/AI)
    │   │   └── Parts Loop
    │   │       ├── Text Parts
    │   │       │   ├── User: Plain text
    │   │       │   └── Assistant: ReactMarkdown
    │   │       └── Tool Parts (JSON display)
    │   └── Scroll Anchor (messagesEndRef)
    └── Input Form - Fixed bottom (disabled)
```

### Client vs Server Components

**Server Components:**
- `layout.tsx` - Default Next.js server component
- Benefits: Can use async/await, direct server access

**Client Components:**
- `page.tsx` - Requires `'use client'` directive
- Uses hooks (`useChat`, `useState`, `useEffect`, `useRef`)
- Interactive UI with state updates

### React Hooks Usage

#### useChat Hook
**Source:** `@ai-sdk/react`
**Purpose:** Complete chat state management

```typescript
const { messages, sendMessage, isLoading } = useChat({
  api: '/api/chat',  // Default endpoint
});

// messages: UIMessage[] - Array of all chat messages
// sendMessage: (input) => void - Send new message
// isLoading: boolean - True when AI is generating response
```

#### useState Hook
```typescript
const [input, setInput] = useState('');
// Stores current input field value
```

#### useRef Hook
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
// DOM references for scroll control
```

#### useEffect Hook
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages, isLoading]);
// Auto-scroll to bottom when messages change
```

### Message Rendering

#### User Messages
```typescript
// Plain text display with whitespace preservation
<div className="whitespace-pre-wrap">{part.text}</div>
```

#### Assistant Messages
```typescript
// ReactMarkdown with custom styled components
<ReactMarkdown
  components={{
    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
    // ... more components
  }}
>
  {part.text}
</ReactMarkdown>
```

#### Tool Results
```typescript
// Pretty-printed JSON
<pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
  {JSON.stringify(part, null, 2)}
</pre>
```

### Auto-Scroll Implementation
```typescript
// Scroll to bottom when:
// 1. New messages arrive
// 2. AI is generating (isLoading changes)
useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, isLoading]);

// messagesEndRef is a div at the end of messages container
<div ref={messagesEndRef} />
```

---

## State Management

### No External State Library
This application **does not use Redux, Zustand, or any external state management library**. All state is managed via React hooks.

### State Architecture

#### Client State (Frontend)
```typescript
// Local UI state
const [input, setInput] = useState('');

// Chat state from @ai-sdk/react
const { messages, sendMessage, isLoading } = useChat();

// DOM references
const messagesEndRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
```

#### Server State (Backend)
```typescript
// Module-level cache (in-memory)
let resumeContent: string | null = null;

// Loaded once at module initialization
const resume = await loadResume();
```

### State Flow

```
User Input → sendMessage() → POST /api/chat
                ↓
        AI SDK useChat Hook
                ↓
        messages array updated
                ↓
        Re-render component
                ↓
        Auto-scroll triggered
```

### Cache Strategy

**Resume Content:**
- **Where:** `/app/api/chat/route.ts` module-level variable
- **When:** Loaded once at server startup (module initialization)
- **Duration:** Persists for entire server process lifetime
- **Invalidation:** Server restart required for updates

**Messages:**
- **Where:** Client-side via `useChat` hook
- **Persistence:** In-memory only (lost on page refresh)
- **No server-side storage** of conversation history

---

## Styling Guidelines

### Tailwind CSS Approach

**Philosophy:** Utility-first CSS with Tailwind classes directly in JSX

#### Common Patterns

**Layout:**
```typescript
// Flexbox column layout
<div className="flex flex-col w-full max-w-md h-screen mx-auto">

// Scrollable container
<div className="flex-1 overflow-y-auto px-4 pt-24 pb-32">

// Fixed bottom element
<form className="fixed bottom-0 w-full max-w-md p-4">
```

**Spacing:**
```typescript
// Padding
px-4  // horizontal padding
py-3  // vertical padding
p-2   // all sides padding

// Margin
mb-4  // margin bottom
mx-auto  // horizontal auto margin (centering)
mt-4  // margin top
```

**Typography:**
```typescript
// Font sizes
text-2xl  // h1
text-xl   // h2
text-lg   // h3
text-sm   // small text
text-xs   // extra small (tool output)

// Font weights
font-bold
font-semibold
```

**Colors:**
```typescript
// Background
bg-white  // light mode
bg-gray-100  // light gray
bg-red-500  // warning banner

// Text
text-white
text-gray-800

// Borders
border-zinc-300
border-t  // top border only
```

#### Dark Mode Strategy

**Approach:** CSS media query `prefers-color-scheme` + Tailwind `dark:` variants

**Examples:**
```typescript
// Background colors
bg-white dark:bg-zinc-900

// Text colors
text-gray-900 dark:text-gray-100

// Borders
border-zinc-300 dark:border-zinc-800

// Code blocks
bg-gray-100 dark:bg-gray-800
```

#### Responsive Design

**Breakpoints:**
- Default: Mobile-first (< 640px)
- `sm:` Small screens (≥ 640px)
- `md:` Medium screens (≥ 768px)
- `lg:` Large screens (≥ 1024px)

**Max Width Strategy:**
```typescript
// Mobile-friendly max width
w-full max-w-md  // Full width, max 28rem (448px)
mx-auto          // Center on larger screens
```

### Custom CSS

**Location:** `/app/globals.css`

**Custom Properties:**
```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**Font Loading:**
```typescript
// In layout.tsx
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono" });

// Applied to body
<body className={`${geistSans.variable} ${geistMono.variable}`}>
```

### Markdown Styling

**Custom Components for ReactMarkdown:**
```typescript
components={{
  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
  p: ({node, ...props}) => <p className="mb-2" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-4" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-4" {...props} />,
  li: ({node, ...props}) => <li className="mb-1" {...props} />,
  code: ({node, ...props}) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} />,
  pre: ({node, ...props}) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto mb-2" {...props} />,
  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
  em: ({node, ...props}) => <em className="italic" {...props} />,
}}
```

**Pattern:** Each markdown element receives Tailwind classes for consistent styling.

---

## Common Development Tasks

### Adding a New Feature

1. **Read existing code first:**
   ```bash
   # Read the file you're modifying
   # Understand current patterns and conventions
   ```

2. **Maintain existing patterns:**
   - Follow current component structure
   - Use similar naming conventions
   - Match existing styling approach

3. **Update resume content:**
   ```bash
   # Edit RESUME.md to add new information
   # Restart server to reload cached content
   pnpm dev
   ```

4. **Test changes:**
   ```bash
   pnpm dev
   # Open http://localhost:3000
   # Test in browser
   ```

### Modifying AI Behavior

#### Change System Prompt
**File:** `/app/api/chat/route.ts:46-48, 60-62, 70-72`

```typescript
// Update the system parameter in all three locations
system: 'You are a helpful assistant that...'
```

**Important:** System prompt appears in 3 places (initial, follow-up, stream). Update all three.

#### Change AI Model
**File:** `/app/api/chat/route.ts:45, 59, 69`

```typescript
// Change model in all three locations
model: anthropic('claude-haiku-4-5-20251001')

// Available models (examples):
// - claude-haiku-4-5-20251001 (current)
// - claude-sonnet-4-5-20250929
// - claude-opus-4-5-20250929
```

#### Modify Tool Definition
**File:** `/app/api/chat/route.ts:23-36`

```typescript
const resumeTool = tool({
  description: 'Update this description...',
  inputSchema: z.object({
    query: z.string().describe('Update parameter description...'),
    // Add new parameters:
    // filter: z.string().optional().describe('...'),
  }),
  execute: async ({ query }) => {
    // Modify tool logic
    return {
      resume: resume,
      query: query,
    };
  },
});
```

### Updating Resume Content

1. **Edit RESUME.md:**
   ```bash
   # Update the markdown file
   # Add/remove/modify content
   ```

2. **Restart server:**
   ```bash
   # Resume is cached at module load time
   # Must restart to reload
   pnpm dev
   ```

3. **Verify changes:**
   ```bash
   # Ask AI a question about new content
   # Confirm it has access to updates
   ```

### Styling Changes

#### Modify Existing Component Styles
**File:** `/app/page.tsx`

```typescript
// Update Tailwind classes directly in JSX
<div className="flex flex-col w-full max-w-md h-screen mx-auto">
//              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//              Modify these classes
```

#### Add Custom CSS
**File:** `/app/globals.css`

```css
/* Add custom styles at bottom of file */
.custom-class {
  /* Your styles */
}
```

#### Modify Markdown Styling
**File:** `/app/page.tsx:40-52`

```typescript
// Update ReactMarkdown components
<ReactMarkdown
  components={{
    h1: ({node, ...props}) => <h1 className="UPDATE CLASSES" {...props} />,
    // ... modify other elements
  }}
>
```

### Re-enabling the Site

**File:** `/app/page.tsx`

**Remove banner:**
```typescript
// Delete lines 22-25
<div className="bg-red-500 dark:bg-red-600 text-white px-4 py-3 text-center font-semibold">
  Site Temporarily Down
</div>
```

**Re-enable form:**
```typescript
// Line 76-79: Update onSubmit handler
onSubmit={e => {
  e.preventDefault();
  sendMessage(input);  // Replace disabled comment
  setInput('');
}}

// Line 81-86: Update input field
<input
  className="w-full p-2 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl dark:bg-zinc-800"
  value={input}
  placeholder="Ask me about the resume..."  // Update placeholder
  onChange={e => setInput(e.target.value)}  // Re-enable onChange
  disabled={false}  // Remove disabled or delete line
/>
```

### Adding Environment Variables

1. **Create `.env.local`:**
   ```bash
   # Never commit this file
   ANTHROPIC_API_KEY=your_key_here
   ```

2. **Update `.gitignore`:**
   ```
   .env.local
   .env*.local
   ```

3. **Use in code:**
   ```typescript
   // Next.js automatically loads .env.local
   const apiKey = process.env.ANTHROPIC_API_KEY;
   ```

### Debugging

#### Enable Verbose Logging
```typescript
// In /app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log('Received messages:', messages);  // Add logging

  const firstResult = await generateText({ ... });
  console.log('First result:', firstResult);  // Add logging

  // ... more logging as needed
}
```

#### Check Server Logs
```bash
pnpm dev
# Server logs appear in terminal
# Check for errors, warnings, console.log output
```

#### Browser DevTools
```javascript
// Check Network tab for API requests
// Check Console for client-side errors
// Check React DevTools for component state
```

---

## Important Notes & Caveats

### Current Status

**⚠️ SITE TEMPORARILY DISABLED**
- Banner displays "Site Temporarily Down"
- Input form is disabled (onChange and onSubmit do nothing)
- All backend code remains functional
- To re-enable: See "Re-enabling the Site" section above

### Resume Caching

**Resume is loaded ONCE at server startup:**
- Changes to `RESUME.md` require server restart
- Module-level variable persists for entire process lifetime
- No hot-reload for resume content
- **To apply changes:** Stop and restart `pnpm dev`

### No Conversation Persistence

**Messages are not stored server-side:**
- Conversation history exists only in client memory
- Page refresh clears all messages
- No database or persistent storage
- Each page load starts fresh conversation

### Tool Call Behavior

**Three-phase response generation:**
- Phase 1: Claude may call `getResumeInfo` tool
- Phase 2: Claude generates text response based on tool result
- Phase 3: Response streamed to client

**Tool calls are automatic:**
- Claude decides when to call the tool
- No manual triggering required
- Tool results appear in message parts

### Dark Mode

**Automatic detection only:**
- Uses CSS `prefers-color-scheme` media query
- No manual toggle switch
- Respects OS/browser dark mode setting
- Styles defined via Tailwind `dark:` variants

### TypeScript Strict Mode

**All type safety features enabled:**
- Must provide types for all parameters
- No implicit `any` types allowed
- Null/undefined checks enforced
- Build will fail on type errors

### Max API Duration

**30-second timeout enforced:**
- Configured in `/app/api/chat/route.ts:8`
- Next.js will terminate request after 30s
- Long-running AI requests may timeout
- Consider increasing if needed for complex queries

### Package Manager

**Use `pnpm` exclusively:**
- Lock file is `pnpm-lock.yaml`
- Using `npm` or `yarn` will create conflicts
- All scripts assume `pnpm`

### Next.js App Router

**Using Next.js 16 App Router:**
- File-based routing in `/app` directory
- Server Components by default
- Client Components require `'use client'` directive
- API routes in `/app/api` as `route.ts` files

### ReactMarkdown Performance

**Markdown rendering on every message:**
- ReactMarkdown parses on each render
- No memoization currently implemented
- Consider `React.memo()` for long conversations
- Performance may degrade with many messages

### No Authentication

**Completely open API:**
- No API key required for `/api/chat`
- No rate limiting implemented
- No user authentication
- Suitable for development only
- **Add authentication before public deployment**

### Environment Variables

**No `.env` file included:**
- Anthropic API key may be needed
- Create `.env.local` for local development
- Never commit `.env.local` to git
- Use Vercel dashboard for production secrets

### Git Branch Strategy

**Development on feature branches:**
- Current: `claude/claude-md-miapb1j4foabmmjc-01UXGhVRbLBWnRFCK7unpyto`
- Pattern suggests temporary development branches
- No main/master branch identified in current status
- Follow project's branching strategy

### PDF Resume

**Static file not dynamically generated:**
- `IkerRedondoResume.pdf` is a static file
- Not generated from `RESUME.md`
- Must manually update PDF when resume changes
- No automated sync between .md and .pdf

### Mobile Responsiveness

**Mobile-first design:**
- Max width: 28rem (448px)
- Optimized for phone screens
- Centered on larger screens
- Fixed bottom input form

### Browser Compatibility

**Modern browsers only:**
- Requires ES2017+ support
- Uses modern React features (hooks)
- CSS variables required
- No IE11 support

---

## Quick Reference

### File Locations
```
Frontend:
  - Main UI: /app/page.tsx
  - Layout: /app/layout.tsx
  - Styles: /app/globals.css

Backend:
  - Chat API: /app/api/chat/route.ts
  - Resume: /RESUME.md

Config:
  - TypeScript: /tsconfig.json
  - Next.js: /next.config.ts
  - Tailwind: /postcss.config.mjs
  - ESLint: /eslint.config.mjs
  - Packages: /package.json
```

### Commands
```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Key Technologies
```
Framework: Next.js 16 (App Router)
UI: React 19
Styling: Tailwind CSS 4
AI: Anthropic Claude Haiku 4.5
Language: TypeScript 5
Package Manager: pnpm
```

### Important URLs
```
Local dev: http://localhost:3000
API endpoint: /api/chat
Documentation: See this file (CLAUDE.md)
```

---

**End of CLAUDE.md**

*This guide should be updated whenever significant changes are made to the codebase architecture, dependencies, or conventions.*
