'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-md h-screen mx-auto">
      {/* Site Temporarily Down Banner */}
      <div className="bg-red-500 dark:bg-red-600 text-white px-4 py-3 text-center font-semibold">
        Site Temporarily Down
      </div>
      
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pt-24 pb-32">
      {messages.map(message => (
        <div key={message.id} className="mb-4">
          <div className="font-semibold mb-1">
            {message.role === 'user' ? 'User: ' : 'AI: '}
          </div>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return (
                  <div key={`${message.id}-${i}`} className="markdown-content">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
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
                      >
                        {part.text}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{part.text}</div>
                    )}
                  </div>
                );
              case 'tool-getResumeInfo':
                return (
                  <pre key={`${message.id}-${i}`} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="fixed bottom-0 w-full max-w-md p-4 bg-white dark:bg-zinc-900 border-t border-zinc-300 dark:border-zinc-800"
        onSubmit={e => {
          e.preventDefault();
          // Disabled - site temporarily down
        }}
      >
        <input
          className="w-full p-2 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl dark:bg-zinc-800 bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
          value={input}
          placeholder="Site temporarily down..."
          onChange={() => {}} // Disabled
          disabled
        />
      </form>
    </div>
  );
}