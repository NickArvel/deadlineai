'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useUser, ScheduleTask } from '@/context/UserContext';

const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
const BG_COLORS = ['#F5F3FF', '#FFFBEB', '#ECFDF5', '#EFF6FF', '#FEF2F2', '#FDF2F8', '#F0FDFA', '#FFF7ED'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];

function getWeekDates(offset = 0) {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
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

type PositionedTask = ScheduleTask & {
  top: number;
  height: number;
  color: string;
  bg: string;
};

const UNAVAIL_MAP: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
  Friday: 4, Saturday: 5, Sunday: 6,
};

export default function SchedulePage() {
  const { profile, updateScheduleTask } = useUser();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const today = new Date();
  const todayIndex = weekDates.findIndex((d) => d.toDateString() === today.toDateString());

  const scheduleTasks = profile?.scheduleTasks ?? [];
  const deadlines = profile?.deadlines ?? [];
  const preferredTime = profile?.preferredTime ?? 'morning';
  const unavailable = profile?.unavailableDays ?? [];

  const allSubjects = useMemo(
    () => [
      ...new Set([
        ...deadlines.map((d) => d.subject),
        ...scheduleTasks.map((t) => t.subject),
      ]),
    ],
    [deadlines, scheduleTasks],
  );

  const unavailIndices = unavailable.map((d) => UNAVAIL_MAP[d] ?? -1);
  const startHour = preferredStartHour(preferredTime);

  // Group tasks by date string
  const tasksByDate = useMemo(() => {
    const map: Record<string, ScheduleTask[]> = {};
    for (const task of scheduleTasks) {
      if (!map[task.date]) map[task.date] = [];
      map[task.date].push(task);
    }
    return map;
  }, [scheduleTasks]);

  // Pre-compute positioned tasks for each day column
  const positionedByDay: PositionedTask[][] = useMemo(
    () =>
      weekDates.map((date) => {
        const dateStr = date.toISOString().slice(0, 10);
        const dayTasks = tasksByDate[dateStr] ?? [];
        let top = (startHour - START_HOUR) * HOUR_HEIGHT + 2;

        return dayTasks.map((task) => {
          const height = Math.max(task.durationHours * HOUR_HEIGHT - 4, 32);
          const subjectIdx = allSubjects.indexOf(task.subject);
          const positioned: PositionedTask = {
            ...task,
            top,
            height,
            color: COLORS[subjectIdx % COLORS.length],
            bg: BG_COLORS[subjectIdx % BG_COLORS.length],
          };
          top += height + 6;
          return positioned;
        });
      }),
    [weekDates, tasksByDate, startHour, allSubjects],
  );

  const thisWeekCount = positionedByDay.reduce((sum, day) => sum + day.length, 0);
  const thisWeekCompleted = positionedByDay.reduce(
    (sum, day) => sum + day.filter((t) => t.completed).length,
    0,
  );

  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">Week of {weekLabel}</h2>
            <p className="text-xs text-gray-400">
              {thisWeekCount === 0
                ? 'No sessions this week'
                : `${thisWeekCompleted}/${thisWeekCount} sessions completed`}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => setWeekOffset(0)}
          className="text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Subject legend */}
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

      {/* Empty state */}
      {scheduleTasks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-sm text-gray-500 font-medium">No study sessions yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Chat with DeadlineAI about an exam and click &ldquo;Add to Deadlines&rdquo; to auto-fill your schedule.
          </p>
        </div>
      )}

      {/* Calendar grid */}
      {scheduleTasks.length > 0 && (
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
            style={{ gridTemplateColumns: '64px repeat(7, 1fr)', height: `${HOUR_HEIGHT * HOURS.length}px` }}
          >
            {/* Hour labels */}
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
              const dayTasks = positionedByDay[dayIndex];

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
                      <span className="text-[10px] text-gray-300 font-medium rotate-90 whitespace-nowrap">
                        Unavailable
                      </span>
                    </div>
                  )}

                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden border transition-all"
                      style={{
                        top: task.top,
                        height: task.height,
                        background: task.completed ? '#F9FAFB' : task.bg,
                        borderColor: task.completed ? '#E5E7EB' : `${task.color}40`,
                        borderLeftColor: task.completed ? '#D1D5DB' : task.color,
                        borderLeftWidth: 3,
                        opacity: task.completed ? 0.65 : 1,
                      }}
                    >
                      <div className="flex items-start gap-1">
                        <button
                          onClick={() => updateScheduleTask(task.id, { completed: !task.completed })}
                          className="shrink-0 mt-0.5 transition-colors hover:opacity-70"
                          title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                          style={{ color: task.completed ? '#9CA3AF' : task.color }}
                        >
                          {task.completed ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-semibold leading-tight truncate"
                            style={{
                              color: task.completed ? '#9CA3AF' : task.color,
                              textDecoration: task.completed ? 'line-through' : 'none',
                            }}
                          >
                            {task.subject}
                          </p>
                          {task.height > 40 && (
                            <p className={`text-[10px] leading-tight truncate mt-0.5 ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                              {task.task}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
