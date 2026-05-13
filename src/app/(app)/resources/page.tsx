'use client';

import { useState } from 'react';
import {
  BookOpen, HelpCircle, PlayCircle,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

type Tab = 'flashcards' | 'questions' | 'youtube';

function FlashCard({ question, answer }: { question: string; answer: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      className="cursor-pointer select-none"
      style={{ perspective: '1000px', height: 168 }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border border-gray-100 bg-white shadow-sm p-4 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Question</p>
          <p className="text-sm text-center text-gray-800 font-medium leading-snug">{question}</p>
          <p className="text-[10px] text-gray-300 mt-3">Click to flip</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl p-4 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#EEEDFE',
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#534AB7' }}
          >
            Answer
          </p>
          <p
            className="text-sm text-center leading-snug font-medium"
            style={{ color: '#534AB7' }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function MockQuestion({
  q,
}: {
  q: { question: string; answer: string; explanation?: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <HelpCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#534AB7' }} />
        <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">{q.question}</span>
        {open ? (
          <ChevronUp size={14} className="text-gray-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={14} className="text-gray-400 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pl-10 border-t border-gray-50">
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{q.answer}</p>
          {q.explanation && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed border-l-2 pl-3 italic" style={{ borderColor: 'rgba(83,74,183,0.3)' }}>
              {q.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function YouTubeCard({
  link,
}: {
  link: { title: string; url: string; description: string };
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-red-200 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50">
        <PlayCircle size={18} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
          {link.title}
        </p>
        {link.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {link.description}
          </p>
        )}
      </div>
      <ExternalLink size={13} className="text-gray-300 shrink-0 mt-0.5" />
    </a>
  );
}

export default function ResourcesPage() {
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('flashcards');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const resources = profile?.resources ?? [];
  const subjects = [...new Set(resources.map((r) => r.subject))];

  const filtered = activeSubject ? resources.filter((r) => r.subject === activeSubject) : resources;

  const allFlashcards = filtered.flatMap((r) =>
    r.flashcards.map((f) => ({ ...f, subject: r.subject, task: r.task })),
  );
  const allQuestions = filtered.flatMap((r) =>
    r.mockQuestions.map((q) => ({ ...q, subject: r.subject, task: r.task })),
  );
  const allVideos = filtered.flatMap((r) =>
    r.youtubeLinks.map((y) => ({ ...y, subject: r.subject, task: r.task })),
  );

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'flashcards', label: 'Flashcards', count: allFlashcards.length, icon: <BookOpen size={13} /> },
    { id: 'questions', label: 'Practice Questions', count: allQuestions.length, icon: <HelpCircle size={13} /> },
    { id: 'youtube', label: 'YouTube Videos', count: allVideos.length, icon: <PlayCircle size={13} /> },
  ];

  if (resources.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: '#EEEDFE' }}
        >
          <BookOpen size={28} style={{ color: '#534AB7' }} />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">No resources yet</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-xs leading-relaxed">
          Chat with DeadlineAI about an upcoming exam or assignment and click{' '}
          <strong>&ldquo;Add to Deadlines&rdquo;</strong> to auto-generate flashcards, practice questions,
          and YouTube videos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Subject filter chips */}
      {subjects.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubject(null)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={
              !activeSubject
                ? { background: '#534AB7', color: '#fff' }
                : { background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB' }
            }
          >
            All Subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(activeSubject === s ? null : s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                activeSubject === s
                  ? { background: '#534AB7', color: '#fff' }
                  : { background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB' }
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={
              activeTab === tab.id
                ? { background: '#534AB7', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                : { color: '#6B7280' }
            }
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={
                activeTab === tab.id
                  ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                  : { background: '#F3F4F6', color: '#6B7280' }
              }
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Flashcards */}
      {activeTab === 'flashcards' && (
        <>
          {allFlashcards.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No flashcards for this selection</p>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {allFlashcards.map((f, i) => (
                <FlashCard key={i} question={f.question} answer={f.answer} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Practice questions */}
      {activeTab === 'questions' && (
        <>
          {allQuestions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No practice questions for this selection</p>
          ) : (
            <div className="space-y-3 max-w-3xl">
              {allQuestions.map((q, i) => (
                <MockQuestion key={i} q={q} />
              ))}
            </div>
          )}
        </>
      )}

      {/* YouTube videos */}
      {activeTab === 'youtube' && (
        <>
          {allVideos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No YouTube videos for this selection</p>
          ) : (
            <div className="space-y-3 max-w-3xl">
              {allVideos.map((y, i) => (
                <YouTubeCard key={i} link={y} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
