'use client';

import { useState } from 'react';
import { Plus, Filter, MoreHorizontal, CheckCircle2, Clock, AlertCircle, Upload, BookOpen, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import UploadModal from '@/components/UploadModal';
import AddDeadlineModal from '@/components/AddDeadlineModal';

const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

const priorityConfig = {
  urgent: { label: 'Urgent', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  high:   { label: 'High',   bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  medium: { label: 'Medium', bg: '#FEFCE8', text: '#CA8A04', border: '#FDE68A' },
  low:    { label: 'Low',    bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

type Priority = keyof typeof priorityConfig;

function getPriority(dueDate: string): Priority {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'urgent';
  if (days <= 2) return 'high';
  if (days <= 5) return 'medium';
  return 'low';
}

function daysLeft(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function formatDueDate(dueDate: string) {
  return new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function colorFor(subject: string, allSubjects: string[]): string {
  const idx = allSubjects.indexOf(subject);
  return COLORS[idx % COLORS.length];
}

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

export default function DeadlinesPage() {
  const { profile, saveProfile } = useUser();
  const [showUpload, setShowUpload] = useState(false);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [planModal, setPlanModal] = useState<{ task: string; plan: string } | null>(null);

  const deadlines = profile?.deadlines ?? [];
  const allSubjects = [...new Set(deadlines.map((d) => d.subject))];

  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  const active = sorted.filter((d) => daysLeft(d.dueDate) >= 0);
  const dueToday = sorted.filter((d) => daysLeft(d.dueDate) === 0);
  const thisWeek = sorted.filter((d) => { const dl = daysLeft(d.dueDate); return dl > 0 && dl <= 7; });

  const tabs = [
    { label: 'All', count: deadlines.length },
    { label: 'Urgent', count: dueToday.length },
    { label: 'This Week', count: thisWeek.length },
  ];

  function removeDeadline(id: string) {
    if (!profile) return;
    saveProfile({ ...profile, deadlines: profile.deadlines.filter((d) => d.id !== id) });
  }

  return (
    <div className="p-6 space-y-5">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {showAddDeadline && <AddDeadlineModal onClose={() => setShowAddDeadline(false)} />}

      {/* Study plan modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Study Plan</p>
                <p className="text-xs text-gray-400 mt-0.5">{planModal.task}</p>
              </div>
              <button
                onClick={() => setPlanModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 leading-relaxed space-y-1">
              {renderMarkdown(planModal.plan)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                i === 0 ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
              style={i === 0 ? { background: '#534AB7' } : {}}
            >
              {tab.label}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  i === 0 ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Filter size={14} />
            Filter
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} />
            Upload
          </button>
          <button
            onClick={() => setShowAddDeadline(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all"
            style={{ background: '#534AB7' }}
          >
            <Plus size={15} />
            New Deadline
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Active', value: String(active.length), icon: <Clock size={16} style={{ color: '#534AB7' }} />, bg: '#EEEDFE' },
          { label: 'Due Today', value: String(dueToday.length), icon: <AlertCircle size={16} className="text-red-500" />, bg: '#FEF2F2' },
          { label: 'This Week', value: String(thisWeek.length), icon: <Clock size={16} className="text-orange-500" />, bg: '#FFF7ED' },
          { label: 'Total Added', value: String(deadlines.length), icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: '#ECFDF5' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: card.bg }}>
              {card.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Deadlines Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="px-5 py-3 border-b border-gray-100 grid text-[10px] font-semibold uppercase tracking-widest text-gray-400"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 40px' }}
        >
          <span>Assignment</span>
          <span>Due Date</span>
          <span>Priority</span>
          <span>Days Left</span>
          <span>Status</span>
          <span />
        </div>

        <div className="divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <p className="px-5 py-10 text-sm text-gray-400 text-center">No deadlines yet. Add one above!</p>
          ) : (
            sorted.map((deadline) => {
              const priority = getPriority(deadline.dueDate);
              const p = priorityConfig[priority];
              const dl = daysLeft(deadline.dueDate);
              const color = colorFor(deadline.subject, allSubjects);
              const hasPlan = !!deadline.studyPlan;

              return (
                <div key={deadline.id}>
                  <div
                    className="px-5 py-4 grid items-center hover:bg-gray-50 transition-colors group"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 40px' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1 h-9 rounded-full shrink-0" style={{ background: color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[#534AB7] transition-colors text-gray-900">
                          {deadline.task}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">{deadline.subject}</p>
                          {deadline.type && (
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              {deadline.type}
                            </span>
                          )}
                          {hasPlan && (
                            <button
                              onClick={() => setPlanModal({ task: deadline.task, plan: deadline.studyPlan! })}
                              className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full transition-colors"
                              style={{ background: '#EEEDFE', color: '#534AB7' }}
                            >
                              <BookOpen size={9} />
                              Study Plan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className={`text-sm font-medium ${dl === 0 ? 'text-red-600' : dl < 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                        {formatDueDate(deadline.dueDate)}
                      </p>
                      <p className="text-xs text-gray-400">11:59 PM</p>
                    </div>

                    <div>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                        style={{ background: p.bg, color: p.text, borderColor: p.border }}
                      >
                        {p.label}
                      </span>
                    </div>

                    <div>
                      <p className={`text-sm font-medium ${dl <= 0 ? 'text-red-600' : dl <= 2 ? 'text-orange-500' : 'text-gray-700'}`}>
                        {dl < 0 ? 'Overdue' : dl === 0 ? 'Due today' : `${dl} day${dl !== 1 ? 's' : ''}`}
                      </p>
                    </div>

                    <div>
                      {dl < 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                          <CheckCircle2 size={13} />
                          Past due
                        </span>
                      ) : dl === 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <AlertCircle size={13} />
                          Due today
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#534AB7' }}>
                          <Clock size={13} />
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => removeDeadline(deadline.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
