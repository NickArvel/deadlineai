import { Clock, CheckSquare, Target, Flame, BellDot, CalendarDays, Plus, Zap } from 'lucide-react';

const upcomingDeadlines = [
  {
    id: 1,
    title: 'Linear Algebra Problem Set 4',
    subject: 'Mathematics',
    dueDate: 'Today, 11:59 PM',
    priority: 'urgent' as const,
    subjectColor: '#8B5CF6',
  },
  {
    id: 2,
    title: 'History Research Paper Draft',
    subject: 'History',
    dueDate: 'Tomorrow',
    priority: 'high' as const,
    subjectColor: '#F59E0B',
  },
  {
    id: 3,
    title: 'Chemistry Lab Report',
    subject: 'Chemistry',
    dueDate: 'May 14',
    priority: 'medium' as const,
    subjectColor: '#10B981',
  },
  {
    id: 4,
    title: 'JavaScript Final Project',
    subject: 'Computer Science',
    dueDate: 'May 17',
    priority: 'low' as const,
    subjectColor: '#3B82F6',
  },
];

const todaysSessions = [
  {
    id: 1,
    subject: 'Mathematics',
    topic: 'Linear Algebra Review',
    startTime: '9:00 AM',
    endTime: '10:30 AM',
    status: 'completed' as const,
  },
  {
    id: 2,
    subject: 'History',
    topic: 'Research Paper Outline',
    startTime: '1:00 PM',
    endTime: '3:00 PM',
    status: 'active' as const,
  },
  {
    id: 3,
    subject: 'Chemistry',
    topic: 'Lab Report Writing',
    startTime: '4:00 PM',
    endTime: '5:30 PM',
    status: 'upcoming' as const,
  },
];

const priorityConfig = {
  urgent: { label: 'Urgent', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  high:   { label: 'High',   bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  medium: { label: 'Medium', bg: '#FEFCE8', text: '#CA8A04', border: '#FDE68A' },
  low:    { label: 'Low',    bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 pb-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, Alex! 👋</h1>
        <p className="text-sm text-gray-500 mt-1">
          You have{' '}
          <span className="font-semibold text-gray-700">4 deadlines</span> this
          week. Stay on track — you&apos;ve got this!
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Current Streak
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">7</p>
              <p className="text-xs text-gray-500 mt-0.5">days in a row</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50">
              <Flame size={20} className="text-orange-500" fill="#F97316" />
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: '#534AB7' }} />
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-gray-100" />
            ))}
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Study Time
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                12.5
                <span className="text-lg font-semibold text-gray-400">h</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">this week</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EEEDFE' }}>
              <Clock size={18} style={{ color: '#534AB7' }} />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-3">↑ 25% vs last week</p>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Tasks Today
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                5
                <span className="text-lg font-semibold text-gray-400">/8</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">3 remaining</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
              <CheckSquare size={18} className="text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: '62.5%' }} />
          </div>
        </div>

        {/* Focus Score */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Focus Score
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                87
                <span className="text-lg font-semibold text-gray-400">%</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">excellent today</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <Target size={18} className="text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-blue-600 font-semibold mt-3">Top 15% of your avg</p>
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
            {upcomingDeadlines.map((deadline) => {
              const p = priorityConfig[deadline.priority];
              return (
                <div
                  key={deadline.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ background: deadline.subjectColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#534AB7] transition-colors">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {deadline.subject} · Due {deadline.dueDate}
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
            })}
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
            <span className="text-xs text-gray-400 font-medium">May 12</span>
          </div>

          <div className="flex-1 px-5 py-4 space-y-5">
            {todaysSessions.map((session) => (
              <div key={session.id} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={
                    session.status === 'completed'
                      ? { background: '#DCFCE7' }
                      : session.status === 'active'
                      ? { background: '#EEEDFE' }
                      : { background: '#F3F4F6' }
                  }
                >
                  {session.status === 'completed' && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
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
                    <p
                      className={`text-sm font-semibold leading-tight ${
                        session.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}
                    >
                      {session.subject}
                    </p>
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
            ))}
          </div>

          <div className="px-5 pb-4">
            <button className="w-full py-2 rounded-lg text-sm font-medium border border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
              + Add session
            </button>
          </div>
        </div>
      </div>

      {/* AI Insight Banner */}
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
              Your Linear Algebra problem set is due{' '}
              <strong className="text-white">tonight</strong>. Based on your past
              sessions, you need ~90 more minutes to finish. Start your next session
              now to stay on track.
            </p>
          </div>
          <button className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            Start Session →
          </button>
        </div>
      </div>
    </div>
  );
}
