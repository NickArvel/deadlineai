'use client';

import { useState } from 'react';
import { Clock, CheckSquare, Target, Flame, BellDot, CalendarDays, Plus, Zap, Upload } from 'lucide-react';
import { useUser, Deadline } from '@/context/UserContext';
import UploadModal from '@/components/UploadModal';

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

function formatDue(dueDate: string): string {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function colorFor(subject: string, allSubjects: string[]): string {
  const idx = allSubjects.indexOf(subject);
  return COLORS[idx % COLORS.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { profile } = useUser();
  const [showUpload, setShowUpload] = useState(false);

  const deadlines = profile?.deadlines ?? [];
  const allSubjects = [...new Set(deadlines.map((d) => d.subject))];

  const active = deadlines
    .filter((d) => {
      const days = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
      return days >= 0;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const userName = profile?.name ?? 'there';

  // Generate simple today sessions based on the most urgent deadline and preferred time
  const preferredTime = profile?.preferredTime ?? 'morning';
  const timeMap: Record<string, string[]> = {
    morning: ['9:00 AM', '10:30 AM', '11:00 AM', '12:30 PM'],
    afternoon: ['1:00 PM', '2:30 PM', '3:00 PM', '4:30 PM'],
    evening: ['5:00 PM', '6:30 PM', '7:00 PM', '8:30 PM'],
  };
  const times = timeMap[preferredTime];

  const todaysSessions = active.slice(0, 2).map((d, i) => ({
    id: d.id,
    subject: d.subject,
    topic: d.task,
    startTime: times[i * 2],
    endTime: times[i * 2 + 1],
    status: i === 0 ? ('active' as const) : ('upcoming' as const),
  }));

  return (
    <div className="p-6 space-y-6 pb-4">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {userName}! 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            You have{' '}
            <span className="font-semibold text-gray-700">{active.length} deadline{active.length !== 1 ? 's' : ''}</span>{' '}
            coming up. Stay on track — you&apos;ve got this!
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all shrink-0"
          style={{ background: '#534AB7' }}
        >
          <Upload size={15} />
          Upload Schedule
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Deadlines Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{active.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">assignments</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50">
              <Flame size={20} className="text-orange-500" fill="#F97316" />
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: Math.min(active.length, 10) }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: '#534AB7' }} />
            ))}
            {Array.from({ length: Math.max(0, 10 - active.length) }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-100" />
            ))}
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Daily Goal</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {profile?.hoursPerDay ?? 0}
                <span className="text-lg font-semibold text-gray-400">h</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">per day</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EEEDFE' }}>
              <Clock size={18} style={{ color: '#534AB7' }} />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-3">Keep it consistent!</p>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Subjects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {allSubjects.length}
                <span className="text-lg font-semibold text-gray-400"> active</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{deadlines.length} total tasks</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckSquare size={18} className="text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(allSubjects.length * 20, 100)}%` }} />
          </div>
        </div>

        {/* Preferred time */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Preferred Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 capitalize">{preferredTime.slice(0, 3)}</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{preferredTime} sessions</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <Target size={18} className="text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-blue-600 font-semibold mt-3">
            {preferredTime === 'morning' ? '🌅' : preferredTime === 'afternoon' ? '☀️' : '🌙'} Your peak zone
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Upcoming Deadlines */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BellDot size={16} style={{ color: '#534AB7' }} />
              <h3 className="font-semibold text-gray-900 text-sm">Upcoming Deadlines</h3>
            </div>
            <button className="text-xs font-semibold hover:underline" style={{ color: '#534AB7' }}>
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {active.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No upcoming deadlines 🎉</p>
            ) : (
              active.map((deadline) => {
                const priority = getPriority(deadline.dueDate);
                const p = priorityConfig[priority];
                const color = colorFor(deadline.subject, allSubjects);
                return (
                  <div
                    key={deadline.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#534AB7] transition-colors">
                        {deadline.task}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {deadline.subject} · Due {formatDue(deadline.dueDate)}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0"
                      style={{ background: p.bg, color: p.text, borderColor: p.border }}
                    >
                      {p.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
              <Plus size={13} />
              Add new deadline
            </button>
          </div>
        </div>

        {/* Today's Study Plan */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} style={{ color: '#534AB7' }} />
              <h3 className="font-semibold text-gray-900 text-sm">Today&apos;s Plan</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex-1 px-5 py-4 space-y-5">
            {todaysSessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Add deadlines to generate your plan</p>
            ) : (
              todaysSessions.map((session) => (
                <div key={session.id} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={
                      session.status === 'active'
                        ? { background: '#EEEDFE' }
                        : { background: '#F3F4F6' }
                    }
                  >
                    {session.status === 'active' && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="#534AB7" stroke="none">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                    {session.status === 'upcoming' && (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight text-gray-900">{session.subject}</p>
                      {session.status === 'active' && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                          style={{ background: '#534AB7' }}
                        >
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{session.topic}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {session.startTime} – {session.endTime}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 pb-4">
            <button className="w-full py-2 rounded-lg text-sm font-medium border border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
              + Add session
            </button>
          </div>
        </div>
      </div>

      {/* AI Insight Banner */}
      {active.length > 0 && (
        <div
          className="rounded-xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #534AB7 0%, #7B73D1 100%)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={18} stroke="white" fill="white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">AI Insight</p>
              <p className="text-white/80 text-sm mt-0.5">
                Your most urgent deadline is <strong className="text-white">{active[0].task}</strong> for {active[0].subject},{' '}
                due <strong className="text-white">{formatDue(active[0].dueDate)}</strong>. Focus on this first!
              </p>
            </div>
            <button className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
              Ask AI →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
