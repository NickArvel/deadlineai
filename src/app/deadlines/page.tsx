'use client';

import { Plus, Filter, MoreHorizontal, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';

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

export default function DeadlinesPage() {
  const { profile } = useUser();
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

  return (
    <div className="p-6 space-y-5">
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
        <div className="px-5 py-3 border-b border-gray-100 grid text-[10px] font-semibold uppercase tracking-widest text-gray-400" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 40px' }}>
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
              return (
                <div
                  key={deadline.id}
                  className="px-5 py-4 grid items-center hover:bg-gray-50 transition-colors cursor-pointer group"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 40px' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 h-9 rounded-full shrink-0" style={{ background: color }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-[#534AB7] transition-colors text-gray-900">
                        {deadline.task}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{deadline.subject}</p>
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
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
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
