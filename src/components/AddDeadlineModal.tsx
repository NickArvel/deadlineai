'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Loader2, Check, BookOpen } from 'lucide-react';
import { useUser, Deadline } from '@/context/UserContext';

type DeadlineType = 'assignment' | 'exam' | 'project' | 'other';
type Step = 'details' | 'exam-info' | 'plan';

type FormData = {
  subject: string;
  task: string;
  type: DeadlineType;
  dueDate: string;
  topics: string;
  format: string;
  comfort: number;
  struggling: string;
};

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i, arr) => {
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
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

export default function AddDeadlineModal({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile } = useUser();
  const [step, setStep] = useState<Step>('details');
  const [plan, setPlan] = useState('');
  const [generating, setGenerating] = useState(false);
  const planRef = useRef('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    subject: '',
    task: '',
    type: 'assignment',
    dueDate: '',
    topics: '',
    format: 'mixed',
    comfort: 5,
    struggling: '',
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [plan]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext() {
    if (!form.subject.trim() || !form.task.trim() || !form.dueDate) return;
    if (form.type === 'exam') {
      setStep('exam-info');
    } else {
      saveDeadline();
    }
  }

  async function handleGeneratePlan() {
    if (!form.topics.trim()) return;
    setStep('plan');
    setGenerating(true);
    setPlan('');
    planRef.current = '';

    try {
      const res = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          task: form.task,
          dueDate: form.dueDate,
          topics: form.topics,
          format: form.format,
          comfort: form.comfort,
          struggling: form.struggling,
          hoursPerDay: profile?.hoursPerDay ?? 2,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        planRef.current += chunk;
        setPlan(planRef.current);
      }
    } catch (err) {
      console.error(err);
      setPlan('Failed to generate study plan. You can still save the deadline and ask the AI for help in chat.');
    } finally {
      setGenerating(false);
    }
  }

  function saveDeadline(studyPlan?: string) {
    if (!profile) return;
    const newDeadline: Deadline = {
      id: Date.now().toString(),
      subject: form.subject.trim(),
      task: form.task.trim(),
      dueDate: form.dueDate,
      type: form.type,
      studyPlan: studyPlan || undefined,
    };
    saveProfile({ ...profile, deadlines: [...profile.deadlines, newDeadline] });
    onClose();
  }

  const isStep1Valid = form.subject.trim() && form.task.trim() && form.dueDate;
  const isStep2Valid = form.topics.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Add Deadline</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'details' && 'Step 1 of 2 — Basic details'}
              {step === 'exam-info' && 'Step 2 of 2 — Exam details'}
              {step === 'plan' && 'Your personalised study plan'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 1: Basic details ── */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  placeholder="e.g. Mathematics, History, Biology"
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 placeholder-gray-400"
                  style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Task name</label>
                <input
                  value={form.task}
                  onChange={(e) => set('task', e.target.value)}
                  placeholder="e.g. Final Exam, Chapter 5 Essay, Lab Report"
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 placeholder-gray-400"
                  style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['assignment', 'exam', 'project', 'other'] as DeadlineType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => set('type', t)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                        form.type === t
                          ? 'text-white border-[#534AB7]'
                          : 'text-gray-600 border-gray-200 bg-white hover:border-[#534AB7]'
                      }`}
                      style={form.type === t ? { background: '#534AB7' } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {form.type === 'exam' && (
                  <p className="text-xs text-[#534AB7] mt-2 font-medium">
                    ✨ We&apos;ll generate a personalised study plan for this exam
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Exam details ── */}
          {step === 'exam-info' && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm mb-2"
                style={{ background: '#F4F3FF', color: '#534AB7' }}
              >
                <BookOpen size={15} className="shrink-0" />
                <span>Answer these questions so the AI can build your personalised study plan.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  What topics or chapters does this exam cover?
                </label>
                <textarea
                  value={form.topics}
                  onChange={(e) => set('topics', e.target.value)}
                  placeholder="e.g. Chapters 3–7: integration, differentiation, limits, series"
                  rows={3}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 placeholder-gray-400 resize-none"
                  style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Exam format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'multiple-choice', label: 'Multiple Choice' },
                    { value: 'essay', label: 'Essay / Written' },
                    { value: 'practical', label: 'Practical / Lab' },
                    { value: 'mixed', label: 'Mixed / Other' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => set('format', f.value)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        form.format === f.value
                          ? 'text-white border-[#534AB7]'
                          : 'text-gray-600 border-gray-200 bg-white hover:border-[#534AB7]'
                      }`}
                      style={form.format === f.value ? { background: '#534AB7' } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  How comfortable are you with this material? (1 = not at all, 10 = very confident)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">1</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={form.comfort}
                    onChange={(e) => set('comfort', Number(e.target.value))}
                    className="flex-1 accent-[#534AB7]"
                  />
                  <span className="text-xs text-gray-400 w-4">10</span>
                  <span
                    className="text-sm font-bold w-8 text-center rounded-lg py-0.5"
                    style={{ color: '#534AB7', background: '#EEEDFE' }}
                  >
                    {form.comfort}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Any specific areas you&apos;re struggling with? <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={form.struggling}
                  onChange={(e) => set('struggling', e.target.value)}
                  placeholder="e.g. Integration by parts, writing introductions, circuit diagrams"
                  rows={2}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 placeholder-gray-400 resize-none"
                  style={{ '--tw-ring-color': '#534AB7' } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Study plan ── */}
          {step === 'plan' && (
            <div>
              {generating && !plan && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: '#EEEDFE' }}
                  >
                    <Loader2 size={24} style={{ color: '#534AB7' }} className="animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Generating your study plan…</p>
                  <p className="text-xs text-gray-400">This takes a few seconds</p>
                </div>
              )}

              {plan && (
                <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed space-y-1">
                  {renderMarkdown(plan)}
                  {generating && (
                    <span
                      className="inline-block w-2 h-4 rounded-sm ml-1 animate-pulse"
                      style={{ background: '#534AB7' }}
                    />
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {step === 'details' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={!isStep1Valid}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40"
                style={{ background: '#534AB7' }}
              >
                {form.type === 'exam' ? 'Next' : 'Save Deadline'}
                {form.type === 'exam' && <ChevronRight size={15} />}
                {form.type !== 'exam' && <Check size={15} />}
              </button>
            </>
          )}

          {step === 'exam-info' && (
            <>
              <button
                onClick={() => setStep('details')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={15} />
                Back
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={!isStep2Valid}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40"
                style={{ background: '#534AB7' }}
              >
                Generate Study Plan
                <ChevronRight size={15} />
              </button>
            </>
          )}

          {step === 'plan' && (
            <>
              <button
                onClick={() => setStep('exam-info')}
                disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Back
              </button>
              <button
                onClick={() => saveDeadline(plan)}
                disabled={generating}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40"
                style={{ background: '#534AB7' }}
              >
                <Check size={15} />
                Save Deadline & Plan
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
