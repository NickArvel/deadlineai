'use client';

import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export default function ChatBar() {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;
    setInput('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 px-6 py-3 shrink-0">
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-3 rounded-xl border bg-gray-50 px-4 py-2.5 transition-all focus-within:border-[#534AB7]"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#EEEDFE' }}
          >
            <Sparkles size={13} style={{ color: '#534AB7' }} />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask DeadlineAI anything… e.g. 'What should I study today?'"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 hover:opacity-90 active:scale-95"
            style={{ background: '#534AB7' }}
          >
            {isLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            {isLoading ? 'Thinking' : 'Send'}
          </button>
        </div>
      </form>
      <p className="text-center text-[10px] text-gray-400 mt-1.5">
        DeadlineAI · Press{' '}
        <kbd className="font-mono bg-gray-100 px-1 rounded text-gray-500">Enter</kbd>{' '}
        to send
      </p>
    </div>
  );
}
