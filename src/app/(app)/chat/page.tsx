'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Zap, BookOpen, CalendarDays, Flame,
  ThumbsUp, ThumbsDown, Loader2,
  Upload, FileText, FileImage, X,
} from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useUser } from '@/context/UserContext';

const suggestions = [
  { icon: <BookOpen size={14} />, text: 'What should I study right now?' },
  { icon: <CalendarDays size={14} />, text: 'Create a Pomodoro plan for today' },
  { icon: <Flame size={14} />, text: 'How do I stop procrastinating?' },
];

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            part
          ),
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function ChatPage() {
  const { messages, isLoading, sendMessage, pendingMessage, clearPending, attachedFile, attachFile, clearAttachment } = useChat();
  const { profile } = useUser();
  const userInitial = profile?.name ? profile.name[0].toUpperCase() : '?';
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (pendingMessage) {
      clearPending();
      sendMessage(pendingMessage);
    }
  }, [pendingMessage, clearPending, sendMessage]);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragActive(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  }

  async function handleFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) return;
    await attachFile(file);
  }

  const isImageFile = attachedFile?.mimeType.startsWith('image/');

  return (
    <div className="flex flex-col h-full">
      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Header banner */}
        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: '#EEEDFE' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#534AB7' }}
          >
            <Zap size={18} stroke="white" fill="white" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#534AB7' }}>
              AI Chat — Powered by DeadlineAI
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Ask me anything about your schedule, deadlines, or study strategies. Drop a file below to analyse it.
            </p>
          </div>
        </div>

        {/* Conversation */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {message.role === 'assistant' ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#534AB7' }}
              >
                <Zap size={14} stroke="white" fill="white" />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #534AB7, #7B73D1)' }}
              >
                {userInitial}
              </div>
            )}

            <div
              className={`max-w-2xl flex flex-col gap-1 ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {message.attachedFileName && (
                <div
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl mb-0.5"
                  style={{ background: 'rgba(83,74,183,0.25)', color: '#fff' }}
                >
                  {message.attachedFileName.match(/\.(jpg|jpeg|png)$/i) ? (
                    <FileImage size={11} />
                  ) : (
                    <FileText size={11} />
                  )}
                  <span className="max-w-[200px] truncate font-medium">{message.attachedFileName}</span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-tr-sm text-white'
                    : 'rounded-tl-sm bg-white border border-gray-100 text-gray-800 shadow-sm'
                }`}
                style={message.role === 'user' ? { background: '#534AB7' } : {}}
              >
                {message.content ? (
                  renderMarkdown(message.content)
                ) : (
                  <span className="inline-block w-2 h-4 rounded-sm animate-pulse" style={{ background: '#534AB7' }} />
                )}
              </div>

              <div
                className={`flex items-center gap-2 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <span className="text-[10px] text-gray-400">{message.timestamp}</span>
                {message.role === 'assistant' && message.content && (
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded text-gray-300 hover:text-emerald-500 transition-colors">
                      <ThumbsUp size={11} />
                    </button>
                    <button className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                      <ThumbsDown size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#534AB7' }}
            >
              <Zap size={14} stroke="white" fill="white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" style={{ color: '#534AB7' }} />
              <span className="text-xs text-gray-400">DeadlineAI is thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggestion chips ── */}
      <div className="px-6 pt-2 pb-3 flex items-center gap-2 flex-wrap border-t border-gray-50">
        <span className="text-xs text-gray-400">Try asking:</span>
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => sendMessage(s.text)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-[#534AB7] hover:text-[#534AB7] transition-colors disabled:opacity-40"
          >
            <span style={{ color: '#534AB7' }}>{s.icon}</span>
            {s.text}
          </button>
        ))}
      </div>

      {/* ── File upload area ── */}
      <div className="px-6 pb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
        />

        {attachedFile ? (
          /* Preview card */
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
            style={{
              background: '#EEEDFE',
              borderColor: 'rgba(83,74,183,0.3)',
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#534AB7' }}
            >
              {isImageFile ? (
                <FileImage size={16} stroke="white" />
              ) : (
                <FileText size={16} stroke="white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#534AB7' }}>
                {attachedFile.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(83,74,183,0.6)' }}>
                Attached · will be sent with your next message
              </p>
            </div>
            <button
              onClick={clearAttachment}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0 hover:bg-[#534AB7]/10"
              style={{ color: '#534AB7' }}
              title="Remove attachment"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-dashed cursor-pointer select-none transition-all"
            style={{
              borderColor: dragActive ? '#534AB7' : 'rgba(83,74,183,0.28)',
              background: dragActive
                ? '#EEEDFE'
                : 'rgba(83,74,183,0.035)',
              transform: dragActive ? 'scale(1.005)' : 'scale(1)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: dragActive ? '#534AB7' : 'rgba(83,74,183,0.12)',
              }}
            >
              <Upload
                size={18}
                style={{ color: dragActive ? '#fff' : '#534AB7' }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 leading-snug">
                Drop your timetable, syllabus or homework here
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                PDF, JPG, PNG supported · or click to browse
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
