import { Plus, Filter, MoreHorizontal, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const deadlines = [
  {
    id: 1,
    title: 'Linear Algebra Problem Set 4',
    subject: 'Mathematics',
    dueDate: 'May 12, 2026',
    dueTime: '11:59 PM',
    daysLeft: 0,
    priority: 'urgent' as const,
    progress: 65,
    subjectColor: '#8B5CF6',
    status: 'in-progress' as const,
  },
  {
    id: 2,
    title: 'History Research Paper Draft',
    subject: 'History',
    dueDate: 'May 13, 2026',
    dueTime: '5:00 PM',
    daysLeft: 1,
    priority: 'high' as const,
    progress: 30,
    subjectColor: '#F59E0B',
    status: 'in-progress' as const,
  },
  {
    id: 3,
    title: 'Chemistry Lab Report',
    subject: 'Chemistry',
    dueDate: 'May 14, 2026',
    dueTime: '11:59 PM',
    daysLeft: 2,
    priority: 'medium' as const,
    progress: 10,
    subjectColor: '#10B981',
    status: 'not-started' as const,
  },
  {
    id: 4,
    title: 'JavaScript Final Project',
    subject: 'Computer Science',
    dueDate: 'May 17, 2026',
    dueTime: '11:59 PM',
    daysLeft: 5,
    priority: 'low' as const,
    progress: 45,
    subjectColor: '#3B82F6',
    status: 'in-progress' as const,
  },
  {
    id: 5,
    title: 'Statistics Quiz 3',
    subject: 'Mathematics',
    dueDate: 'May 8, 2026',
    dueTime: '2:00 PM',
    daysLeft: -4,
    priority: 'urgent' as const,
    progress: 100,
    subjectColor: '#8B5CF6',
    status: 'completed' as const,
  },
  {
    id: 6,
    title: 'Essay: Causes of WWI',
    subject: 'History',
    dueDate: 'May 5, 2026',
    dueTime: '11:59 PM',
    daysLeft: -7,
    priority: 'medium' as const,
    progress: 100,
    subjectColor: '#F59E0B',
    status: 'completed' as const,
  },
];

const priorityConfig = {
  urgent: { label: 'Urgent', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  high:   { label: 'High',   bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  medium: { label: 'Medium', bg: '#FEFCE8', text: '#CA8A04', border: '#FDE68A' },
  low:    { label: 'Low',    bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

const tabs = [
  { label: 'All', count: 6 },
  { label: 'Urgent', count: 1 },
  { label: 'This Week', count: 4 },
  { label: 'Completed', count: 2 },
];

export default function DeadlinesPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                i === 0
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
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
          { label: 'Total Active', value: '4', icon: <Clock size={16} style={{ color: '#534AB7' }} />, bg: '#EEEDFE' },
          { label: 'Due Today', value: '1', icon: <AlertCircle size={16} className="text-red-500" />, bg: '#FEF2F2' },
          { label: 'This Week', value: '3', icon: <Clock size={16} className="text-orange-500" />, bg: '#FFF7ED' },
          { label: 'Completed', value: '2', icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: '#ECFDF5' },
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
          <span>Progress</span>
          <span>Status</span>
          <span />
        </div>

        <div className="divide-y divide-gray-50">
          {deadlines.map((deadline) => {
            const p = priorityConfig[deadline.priority];
            return (
              <div
                key={deadline.id}
                className="px-5 py-4 grid items-center hover:bg-gray-50 transition-colors cursor-pointer group"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 40px' }}
              >
                {/* Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-9 rounded-full shrink-0" style={{ background: deadline.subjectColor }} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate group-hover:text-[#534AB7] transition-colors ${deadline.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {deadline.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{deadline.subject}</p>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <p className={`text-sm font-medium ${deadline.daysLeft === 0 ? 'text-red-600' : deadline.daysLeft < 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                    {deadline.daysLeft === 0 ? 'Today' : deadline.daysLeft < 0 ? deadline.dueDate : deadline.dueDate}
                  </p>
                  <p className="text-xs text-gray-400">{deadline.dueTime}</p>
                </div>

                {/* Priority */}
                <div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: p.bg, color: p.text, borderColor: p.border }}
                  >
                    {p.label}
                  </span>
                </div>

                {/* Progress */}
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${deadline.progress}%`,
                          background: deadline.status === 'completed' ? '#10B981' : '#534AB7',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 w-7 text-right">{deadline.progress}%</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  {deadline.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={13} />
                      Done
                    </span>
                  ) : deadline.status === 'in-progress' ? (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#534AB7' }}>
                      <Clock size={13} />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                      <AlertCircle size={13} />
                      Not started
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
