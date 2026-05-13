'use client';

import { useRef, useState } from 'react';
import { Send, Sparkles, Loader2, Paperclip, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useChat } from '@/context/ChatContext';

export default function ChatBar() {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, attachedFile, attachFile, clearAttachment } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const onChatPage = pathname === '/chat';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if ((!content && !attachedFile) || isLoading) return;
    setInput('');
    await sendMessage(content || 'Please analyze this file.');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) return;
    await attachFile(file);
  };

  const canSend = (input.trim() || attachedFile) && !isLoading;

  return (
    <div className="bg-white border-t border-gray-100 px-6 py-3 shrink-0">
      {/* File attachment preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 bg-[#EEEDFE] text-[#534AB7] text-xs font-medium px-3 py-1.5 rounded-full">
            <Paperclip size={11} />
            <span className="max-w-[200px] truncate">{attachedFile.name}</span>
          </div>
          <button
            onClick={clearAttachment}
            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      )}

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
            placeholder={
              attachedFile
                ? 'Ask something about this file…'
                : "Ask DeadlineAI anything… e.g. 'What should I study today?'"
            }
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            disabled={isLoading}
          />

          {/* Paperclip — only shown on chat page */}
          {onChatPage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach image or PDF"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#534AB7] hover:bg-[#EEEDFE] transition-colors disabled:opacity-30"
              >
                <Paperclip size={15} />
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={!canSend}
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
        to send{onChatPage ? ' · Attach files with 📎' : ''}
      </p>
    </div>
  );
}
