import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dates = ['12', '13', '14', '15', '16', '17', '18'];
const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];

const sessions = [
  {
    id: 1,
    day: 0, // Mon
    startHour: 9,
    durationHours: 1.5,
    subject: 'Mathematics',
    topic: 'Linear Algebra Review',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 2,
    day: 0,
    startHour: 13,
    durationHours: 2,
    subject: 'History',
    topic: 'Research Paper Outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 3,
    day: 0,
    startHour: 16,
    durationHours: 1.5,
    subject: 'Chemistry',
    topic: 'Lab Report Writing',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 4,
    day: 1, // Tue
    startHour: 10,
    durationHours: 2,
    subject: 'Computer Science',
    topic: 'JavaScript Final Project',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 5,
    day: 2, // Wed
    startHour: 9,
    durationHours: 1,
    subject: 'Mathematics',
    topic: 'Practice Problems',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 6,
    day: 2,
    startHour: 14,
    durationHours: 1.5,
    subject: 'Chemistry',
    topic: 'Review & Revise Lab Report',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 7,
    day: 3, // Thu
    startHour: 11,
    durationHours: 2,
    subject: 'History',
    topic: 'Final Paper Write-up',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 8,
    day: 4, // Fri
    startHour: 13,
    durationHours: 3,
    subject: 'Computer Science',
    topic: 'JS Project Completion',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
];

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 8;

function getSessionStyle(session: (typeof sessions)[0]) {
  const top = (session.startHour - START_HOUR) * HOUR_HEIGHT;
  const height = session.durationHours * HOUR_HEIGHT - 4;
  return { top, height };
}

export default function SchedulePage() {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">Week of May 12–18, 2026</h2>
            <p className="text-xs text-gray-400">5 study sessions planned this week</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            className="flex items-center gap-2 text-sm font-semibold text-white px-3 py-2 rounded-lg hover:opacity-90 transition-all"
            style={{ background: '#534AB7' }}
          >
            <Plus size={15} />
            Add Session
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {[
          { label: 'Mathematics', color: '#8B5CF6' },
          { label: 'History', color: '#F59E0B' },
          { label: 'Chemistry', color: '#10B981' },
          { label: 'Computer Science', color: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
          <div className="py-3 border-r border-gray-100" />
          {days.map((day, i) => (
            <div
              key={day}
              className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${
                i === 0 ? 'bg-[#EEEDFE]' : ''
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-[#534AB7]' : 'text-gray-400'}`}>
                {day}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${i === 0 ? 'text-[#534AB7]' : 'text-gray-900'}`}>
                {dates[i]}
              </p>
              {i === 0 && (
                <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: '#534AB7' }} />
              )}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div
          className="grid overflow-y-auto"
          style={{
            gridTemplateColumns: '64px repeat(7, 1fr)',
            height: `${HOUR_HEIGHT * hours.length}px`,
          }}
        >
          {/* Time labels */}
          <div className="border-r border-gray-100">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-gray-50 flex items-start justify-end pr-3 pt-1"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] text-gray-400 font-medium">{hour}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div
              key={day}
              className={`border-r border-gray-50 last:border-r-0 relative ${
                dayIndex === 0 ? 'bg-[#FAFAFE]' : ''
              }`}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-gray-50"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {/* Sessions */}
              {sessions
                .filter((s) => s.day === dayIndex)
                .map((session) => {
                  const style = getSessionStyle(session);
                  return (
                    <div
                      key={session.id}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden border"
                      style={{
                        top: style.top + 2,
                        height: style.height,
                        background: session.bg,
                        borderColor: session.color + '40',
                        borderLeftColor: session.color,
                        borderLeftWidth: 3,
                      }}
                    >
                      <p className="text-xs font-semibold leading-tight truncate" style={{ color: session.color }}>
                        {session.subject}
                      </p>
                      {style.height > 40 && (
                        <p className="text-[10px] text-gray-500 leading-tight truncate mt-0.5">
                          {session.topic}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
