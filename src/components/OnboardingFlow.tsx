'use client';

import { useState } from 'react';
import { Zap, Send } from 'lucide-react';
import { useUser, UserProfile, Deadline } from '@/context/UserContext';

type Step =
  | 'name'
  | 'hours'
  | 'time'
  | 'days'
  | 'deadline_subject'
  | 'deadline_task'
  | 'deadline_date'
  | 'more_deadlines'
  | 'done';

type ChatMsg = { role: 'assistant' | 'user'; text: string };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

function botMsg(text: string): ChatMsg {
  return { role: 'assistant', text };
}

export default function OnboardingFlow() {
  const { saveProfile } = useUser();

  const [messages, setMessages] = useState<ChatMsg[]>([
    botMsg("Hi! I'm DeadlineAI. I'll set up your personalised study planner in just a minute. What's your name?"),
  ]);
  const [step, setStep] = useState<Step>('name');
  const [input, setInput] = useState('');

  // Collected data
  const [name, setName] = useState('');
  const [hours, setHours] = useState(0);
  const [prefTime, setPrefTime] = useState<UserProfile['preferredTime']>('morning');
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  // Temp deadline fields
  const [dlSubject, setDlSubject] = useState('');
  const [dlTask, setDlTask] = useState('');

  function pushMsg(role: 'assistant' | 'user', text: string) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  function advance(userText: string, nextStep: Step, botText: string) {
    pushMsg('user', userText);
    setTimeout(() => {
      pushMsg('assistant', botText);
      setStep(nextStep);
    }, 300);
  }

  // Quick-reply chips
  function TimeChips() {
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {(['morning', 'afternoon', 'evening'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTimeSelect(t)}
            className="px-4 py-2 rounded-full border text-sm font-medium capitalize transition-all hover:border-[#534AB7] hover:text-[#534AB7] bg-white border-gray-200 text-gray-700"
          >
            {t === 'morning' ? '🌅 Morning' : t === 'afternoon' ? '☀️ Afternoon' : '🌙 Evening'}
          </button>
        ))}
      </div>
    );
  }

  function DayChips() {
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => toggleDay(d)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
              unavailable.includes(d)
                ? 'bg-[#534AB7] text-white border-[#534AB7]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#534AB7]'
            }`}
          >
            {d.slice(0, 3)}
          </button>
        ))}
        <button
          onClick={confirmDays}
          className="px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#534AB7' }}
        >
          Confirm →
        </button>
      </div>
    );
  }

  function MoreDeadlineChips() {
    return (
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => startDeadline()}
          className="px-4 py-2 rounded-full border text-sm font-medium bg-white border-gray-200 text-gray-700 hover:border-[#534AB7] hover:text-[#534AB7] transition-all"
        >
          + Add another
        </button>
        <button
          onClick={finishOnboarding}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: '#534AB7' }}
        >
          Done, let&apos;s go! →
        </button>
      </div>
    );
  }

  function toggleDay(d: string) {
    setUnavailable((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function confirmDays() {
    const text = unavailable.length === 0 ? 'No unavailable days' : unavailable.join(', ');
    advance(text, 'deadline_subject', "Great! Now let's add your deadlines. What subject is your first assignment for?");
  }

  function handleTimeSelect(t: UserProfile['preferredTime']) {
    setPrefTime(t);
    advance(t.charAt(0).toUpperCase() + t.slice(1), 'days', "Got it! Are there any days you can't study? Tap to select, then hit Confirm.");
  }

  function startDeadline() {
    pushMsg('assistant', 'What subject is this assignment for?');
    setStep('deadline_subject');
  }

  function finishOnboarding() {
    const profile: UserProfile = {
      name,
      hoursPerDay: hours,
      preferredTime: prefTime,
      unavailableDays: unavailable,
      deadlines,
      onboardingComplete: true,
    };
    saveProfile(profile);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    processInput(text);
  }

  function processInput(text: string) {
    switch (step) {
      case 'name': {
        setName(text);
        advance(text, 'hours', `Nice to meet you, ${text}! How many hours per day can you dedicate to studying? (e.g. 2, 3, 4)`);
        break;
      }
      case 'hours': {
        const n = parseFloat(text);
        const h = isNaN(n) ? 2 : Math.min(Math.max(n, 0.5), 12);
        setHours(h);
        advance(text, 'time', `${h} hours a day — solid! Do you prefer studying in the morning, afternoon, or evening?`);
        break;
      }
      case 'deadline_subject': {
        setDlSubject(text);
        advance(text, 'deadline_task', `What's the specific task or assignment for ${text}?`);
        break;
      }
      case 'deadline_task': {
        setDlTask(text);
        advance(text, 'deadline_date', 'When is it due? (e.g. May 20, 2026 or 2026-05-20)');
        break;
      }
      case 'deadline_date': {
        const parsed = parseDate(text);
        const newDeadline: Deadline = {
          id: Date.now().toString(),
          subject: dlSubject,
          task: dlTask,
          dueDate: parsed,
        };
        const updated = [...deadlines, newDeadline];
        setDeadlines(updated);
        advance(text, 'more_deadlines', `Added! "${dlTask}" for ${dlSubject} due ${parsed}. Do you have more deadlines to add?`);
        break;
      }
    }
  }

  function parseDate(raw: string): string {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    // Try "May 20 2026" style
    const attempt = new Date(raw.replace(',', ''));
    if (!isNaN(attempt.getTime())) return attempt.toISOString().split('T')[0];
    return raw;
  }

  const showDayChips = step === 'days';
  const showTimeChips = step === 'time';
  const showMoreChips = step === 'more_deadlines';
  const hideInput = showDayChips || showTimeChips || showMoreChips;

  return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ background: '#F4F4F8' }}>
      <div className="w-full max-w-lg flex flex-col h-full max-h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ background: '#534AB7' }}>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Zap size={18} stroke="white" fill="white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">DeadlineAI Setup</p>
            <p className="text-white/70 text-xs">Let&apos;s personalise your planner</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#534AB7' }}>
                  <Zap size={12} stroke="white" fill="white" />
                </div>
              )}
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}
                style={msg.role === 'user' ? { background: '#534AB7' } : {}}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Inline chips after last bot message */}
          {showTimeChips && <TimeChips />}
          {showDayChips && <DayChips />}
          {showMoreChips && <MoreDeadlineChips />}
        </div>

        {/* Input */}
        {!hideInput && (
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer…"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 text-gray-900 placeholder-gray-400"
              style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              style={{ background: '#534AB7' }}
            >
              <Send size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
