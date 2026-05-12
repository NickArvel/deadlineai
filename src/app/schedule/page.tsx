'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
const BG_COLORS = ['#F5F3FF', '#FFFBEB', '#ECFDF5', '#EFF6FF', '#FEF2F2', '#FDF2F8', '#F0FDFA', '#FFF7ED'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];

// Get Mon-Sun dates for the current week
function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function preferredStartHour(time: string) {
  if (time === 'morning') return 9;
  if (time === 'afternoon') return 13;
  return 17;
}

export default function SchedulePage() {
  const { profile } = useUser();

  const weekDates = getWeekDates();
  const today = new Date();
  const todayIndex = weekDates.findIndex(
    (d) => d.toDateString() === today.toDateString(),
  );

  const deadlines = profile?.deadlines ?? [];
  const preferredTime = profile?.preferredTime ?? 'morning';
  const unavailable = profile?.unavailableDays ?? [];
  const hoursPerDay = profile?.hoursPerDay ?? 2;

  const allSubjects = [...new Set(deadlines.map((d) => d.subject))];

  // Generate sessions: for each active deadline, assign a day slot this week
  const sessions: Array<{
    id: string;
    day: number;
    startHour: number;
    durationHours: number;
    subject: string;
    topic: string;
    color: string;
    bg: string;
  }> = [];

  const UNAVAIL_MAP: Record<string, number> = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
    Friday: 4, Saturday: 5, Sunday: 6,
  };

  const unavailIndices = unavailable.map((d) => UNAVAIL_MAP[d] ?? -1);
  const startHour = preferredStartHour(preferredTime);

  const activeDeadlines = deadlines
    .filter((d) => {
      const dl = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
      return dl >= 0;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Assign one session per deadline to an available day
  let dayOffset = 0;
  for (const dl of activeDeadlines) {
    while (dayOffset < 7 && unavailIndices.includes(dayOffset)) dayOffset++;
    if (dayOffset >= 7) break;

    const subjectIdx = allSubjects.indexOf(dl.subject);
    sessions.push({
      id: dl.id,
      day: dayOffset,
      startHour,
      durationHours: Math.min(hoursPerDay, 3),
      subject: dl.subject,
      topic: dl.task,
      color: COLORS[subjectIdx % COLORS.length],
      bg: BG_COLORS[subjectIdx % BG_COLORS.length],
    });
    dayOffset++;
  }

  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">Week of {weekLabel}</h2>
            <p className="text-xs text-gray-400">{sessions.length} study session{sessions.length !== 1 ? 's' : ''} planned this week</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
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
      {allSubjects.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          {allSubjects.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-gray-500">{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
          <div className="py-3 border-r border-gray-100" />
          {DAYS.map((day, i) => {
            const isToday = i === todayIndex;
            return (
              <div
                key={day}
                className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-[#EEEDFE]' : ''}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-[#534AB7]' : 'text-gray-400'}`}>
                  {day}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-[#534AB7]' : 'text-gray-900'}`}>
                  {weekDates[i].getDate()}
                </p>
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: '#534AB7' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div
          className="grid overflow-y-auto"
          style={{
            gridTemplateColumns: '64px repeat(7, 1fr)',
            height: `${HOUR_HEIGHT * HOURS.length}px`,
          }}
        >
          {/* Time labels */}
          <div className="border-r border-gray-100">
            {HOURS.map((hour) => (
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
          {DAYS.map((day, dayIndex) => {
            const isUnavail = unavailIndices.includes(dayIndex);
            return (
              <div
                key={day}
                className={`border-r border-gray-50 last:border-r-0 relative ${
                  dayIndex === todayIndex ? 'bg-[#FAFAFE]' : isUnavail ? 'bg-gray-50/50' : ''
                }`}
              >
                {HOURS.map((hour) => (
                  <div key={hour} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
                ))}

                {isUnavail && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-gray-300 font-medium rotate-90 whitespace-nowrap">Unavailable</span>
                  </div>
                )}

                {sessions
                  .filter((s) => s.day === dayIndex)
                  .map((session) => {
                    const top = (session.startHour - START_HOUR) * HOUR_HEIGHT;
                    const height = session.durationHours * HOUR_HEIGHT - 4;
                    return (
                      <div
                        key={session.id}
                        className="absolute left-1 right-1 rounded-lg px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden border"
                        style={{
                          top: top + 2,
                          height,
                          background: session.bg,
                          borderColor: session.color + '40',
                          borderLeftColor: session.color,
                          borderLeftWidth: 3,
                        }}
                      >
                        <p className="text-xs font-semibold leading-tight truncate" style={{ color: session.color }}>
                          {session.subject}
                        </p>
                        {height > 40 && (
                          <p className="text-[10px] text-gray-500 leading-tight truncate mt-0.5">
                            {session.topic}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
