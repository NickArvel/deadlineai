import { Flame, Clock, CheckCircle2, BookOpen, Award, TrendingUp } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', hours: 3.5, label: '3.5h' },
  { day: 'Tue', hours: 2,   label: '2h' },
  { day: 'Wed', hours: 4,   label: '4h' },
  { day: 'Thu', hours: 1.5, label: '1.5h' },
  { day: 'Fri', hours: 2.5, label: '2.5h' },
  { day: 'Sat', hours: 0,   label: '—' },
  { day: 'Sun', hours: 0,   label: '—' },
];

const MAX_HOURS = 5;

const subjects = [
  { name: 'Mathematics',     hours: 4.5,  sessions: 6,  color: '#8B5CF6', pct: 36 },
  { name: 'History',         hours: 3.5,  sessions: 4,  color: '#F59E0B', pct: 28 },
  { name: 'Chemistry',       hours: 2.5,  sessions: 3,  color: '#10B981', pct: 20 },
  { name: 'Computer Science', hours: 2,   sessions: 3,  color: '#3B82F6', pct: 16 },
];

const achievements = [
  { title: '7-Day Streak',      desc: 'Studied 7 days in a row',            icon: '🔥', earned: true },
  { title: 'Early Bird',        desc: 'Started a session before 8 AM',       icon: '🌅', earned: true },
  { title: 'Deep Focus',        desc: 'Completed a 3-hour focus block',       icon: '🎯', earned: true },
  { title: 'All Nighter',       desc: 'Studied past midnight',               icon: '🌙', earned: false },
  { title: '30-Day Streak',     desc: 'Study every day for a month',          icon: '📆', earned: false },
  { title: 'Perfect Week',      desc: 'Complete all sessions in one week',    icon: '⭐', earned: false },
];

const streakDays = Array.from({ length: 35 }, (_, i) => {
  if (i >= 28) return 'future';
  if (i >= 21) return 'streak';
  if (i === 15 || i === 16) return 'missed';
  if (Math.random() > 0.2) return 'done';
  return 'missed';
});

export default function ProgressPage() {
  const totalHours = weeklyData.reduce((s, d) => s + d.hours, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Your Learning Journey</h1>
        <p className="text-sm text-gray-500 mt-0.5">Week of May 12–18, 2026</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'This Week',    value: `${totalHours}h`,  sub: 'Study Time',      icon: <Clock size={18} style={{ color: '#534AB7' }} />, bg: '#EEEDFE' },
          { label: 'Current',      value: '7',               sub: 'Day Streak 🔥',   icon: <Flame size={18} className="text-orange-500" />,   bg: '#FFF7ED' },
          { label: 'Completed',    value: '14',              sub: 'Sessions Total',   icon: <CheckCircle2 size={18} className="text-emerald-500" />, bg: '#ECFDF5' },
          { label: 'Subjects',     value: '4',               sub: 'Active Subjects',  icon: <BookOpen size={18} className="text-blue-500" />,  bg: '#EFF6FF' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Weekly Bar Chart */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: '#534AB7' }} />
              <h3 className="font-semibold text-gray-900 text-sm">Study Hours This Week</h3>
            </div>
            <span className="text-xs font-semibold text-gray-400">{totalHours}h total</span>
          </div>

          <div className="flex items-end gap-3 h-40">
            {weeklyData.map((d, i) => {
              const height = d.hours > 0 ? (d.hours / MAX_HOURS) * 100 : 0;
              const isToday = i === 0;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t-md transition-all" style={{
                      height: `${height}%`,
                      minHeight: d.hours > 0 ? 4 : 0,
                      background: isToday ? '#534AB7' : d.hours > 0 ? '#EEEDFE' : 'transparent',
                    }} />
                  </div>
                  <span className={`text-xs font-semibold ${isToday ? 'text-[#534AB7]' : 'text-gray-500'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400">Daily average</p>
              <p className="text-sm font-bold text-gray-900">1.8h</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Best day</p>
              <p className="text-sm font-bold text-gray-900">Wed · 4h</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">vs last week</p>
              <p className="text-sm font-bold text-emerald-600">↑ +2.5h</p>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={16} style={{ color: '#534AB7' }} />
            <h3 className="font-semibold text-gray-900 text-sm">Subject Breakdown</h3>
          </div>

          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: subject.color }} />
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-900">{subject.hours}h</span>
                    <span className="text-xs text-gray-400 ml-1">· {subject.sessions} sessions</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${subject.pct}%`, background: subject.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-3">Most studied this week</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F5F3FF' }}>
                <BookOpen size={14} style={{ color: '#8B5CF6' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Mathematics</p>
                <p className="text-xs text-gray-400">4.5h · 36% of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Streak Calendar — Last 5 Weeks</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#534AB7' }} />
              Studied
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-100" />
              Missed
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-gray-400 mb-1">{d}</div>
          ))}
          {streakDays.map((status, i) => (
            <div
              key={i}
              className="aspect-square rounded-md"
              style={{
                background:
                  status === 'streak' ? '#534AB7' :
                  status === 'done' ? '#EEEDFE' :
                  status === 'future' ? 'transparent' :
                  '#F3F4F6',
                border: status === 'future' ? '1.5px dashed #E5E7EB' : 'none',
              }}
              title={status}
            />
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} style={{ color: '#534AB7' }} />
          <h3 className="font-semibold text-gray-900 text-sm">Achievements</h3>
          <span className="text-xs font-semibold text-gray-400 ml-auto">3 / 6 earned</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div
              key={a.title}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                a.earned
                  ? 'border-gray-100 bg-white'
                  : 'border-dashed border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className={`text-2xl ${!a.earned ? 'grayscale' : ''}`}>{a.icon}</div>
              <div>
                <p className={`text-sm font-semibold ${a.earned ? 'text-gray-900' : 'text-gray-400'}`}>
                  {a.title}
                </p>
                <p className="text-xs text-gray-400">{a.desc}</p>
              </div>
              {a.earned && (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 ml-auto" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
