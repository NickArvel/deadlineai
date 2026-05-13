'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export type Deadline = {
  id: string;
  subject: string;
  task: string;
  dueDate: string; // YYYY-MM-DD
  type?: 'assignment' | 'exam' | 'project' | 'other';
  studyPlan?: string;
};

export type ScheduleTask = {
  id: string;
  deadlineId: string;
  subject: string;
  task: string;
  date: string; // YYYY-MM-DD
  durationHours: number;
  completed: boolean;
};

export type Resource = {
  id: string;
  deadlineId: string;
  subject: string;
  task: string;
  flashcards: { question: string; answer: string }[];
  mockQuestions: { question: string; answer: string; explanation?: string }[];
  youtubeLinks: { title: string; url: string; description: string }[];
  createdAt: string;
};

export type UserProfile = {
  name: string;
  hoursPerDay: number;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  unavailableDays: string[];
  deadlines: Deadline[];
  onboardingComplete: boolean;
  scheduleTasks?: ScheduleTask[];
  resources?: Resource[];
};

type UserContextType = {
  profile: UserProfile | null;
  isLoaded: boolean;
  saveProfile: (p: UserProfile) => void;
  resetProfile: () => void;
  addScheduleTasks: (tasks: ScheduleTask[]) => void;
  updateScheduleTask: (id: string, updates: Partial<ScheduleTask>) => void;
  addResource: (resource: Resource) => void;
};

const UserContext = createContext<UserContextType | null>(null);

function storageKey(userId: string) {
  return `deadlineai_profile_${userId}`;
}

const UNAVAIL_DOW: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

// Always use local date so tasks match calendar cells regardless of timezone
function localDateStr(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

// Fallback: one generic session per available day until the due date
export function generateScheduleTasks(deadline: Deadline, profile: UserProfile): ScheduleTask[] {
  const unavailDow = (profile.unavailableDays ?? []).map((d) => UNAVAIL_DOW[d] ?? -1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline.dueDate);
  due.setHours(23, 59, 59, 999);

  const tasks: ScheduleTask[] = [];
  const current = new Date(today);

  while (current <= due) {
    if (!unavailDow.includes(current.getDay())) {
      const dateStr = localDateStr(current);
      tasks.push({
        id: `${deadline.id}_${dateStr}`,
        deadlineId: deadline.id,
        subject: deadline.subject,
        task: deadline.task,
        date: dateStr,
        durationHours: Math.min(profile.hoursPerDay ?? 2, 3),
        completed: false,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return tasks;
}

/**
 * Parse "Day N: description" entries from the AI study plan text and map each
 * to an actual calendar date, skipping the student's unavailable days.
 * Falls back to generateScheduleTasks when no day entries are found.
 */
export function parseStudyPlanTasks(
  studyPlan: string,
  deadline: Deadline,
  profile: UserProfile,
): ScheduleTask[] {
  const lines = studyPlan.split('\n');

  // Match lines that look like "Day 1:", "**Day 2:**", "Day 3 (Monday):", etc.
  const dayHeaderRe = /^\*{0,2}Day\s+(\d+)(?:\s*\([^)]*\))?\*{0,2}\s*[:\-–—]/i;

  const dayEntries: { day: number; description: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(dayHeaderRe);
    if (!m) continue;

    const dayNum = parseInt(m[1], 10);
    if (dayNum <= 0 || dayEntries.find((e) => e.day === dayNum)) continue;

    // Grab same-line content after the "Day N:" prefix
    const afterHeader = line.slice(line.indexOf(m[0]) + m[0].length)
      .replace(/^\*+/, '')
      .trim();

    let description = afterHeader;

    // If nothing on the same line, collect the first 1-2 bullet points below
    if (!description) {
      const bullets: string[] = [];
      for (let j = i + 1; j < lines.length && bullets.length < 2; j++) {
        const next = lines[j].trim();
        if (next.match(/\*{0,2}Day\s+\d+/i)) break; // next day section
        const bullet = next
          .replace(/^[-•*]\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        if (bullet.length > 3) bullets.push(bullet);
      }
      description = bullets.join('; ');
    }

    // Strip duration hints like "(2 hours)" or "(30 mins)" and bold markers
    description = description
      .replace(/\*\*/g, '')
      .replace(/\s*\([\d.,]+\s*-?\s*[\d.,]*\s*h(?:ours?)?\)/gi, '')
      .replace(/\s*\([\d]+\s*-?\s*[\d]*\s*min(?:utes?)?\)/gi, '')
      .trim();

    if (description.length > 2) {
      dayEntries.push({ day: dayNum, description });
    }
  }

  if (dayEntries.length === 0) {
    return generateScheduleTasks(deadline, profile);
  }

  dayEntries.sort((a, b) => a.day - b.day);

  // Build a list of available study dates starting from today
  const unavailDow = (profile.unavailableDays ?? []).map((d) => UNAVAIL_DOW[d] ?? -1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDay = dayEntries[dayEntries.length - 1].day;
  const availableDates: string[] = [];
  const cursor = new Date(today);

  // Generate enough available dates to cover maxDay study-days (cap at 365)
  while (availableDates.length < maxDay && availableDates.length < 365) {
    if (!unavailDow.includes(cursor.getDay())) {
      availableDates.push(localDateStr(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const tasks: ScheduleTask[] = [];
  for (const entry of dayEntries) {
    const dateStr = availableDates[entry.day - 1]; // Day 1 → index 0
    if (!dateStr) continue;
    tasks.push({
      id: `${deadline.id}_day${entry.day}`,
      deadlineId: deadline.id,
      subject: deadline.subject,
      task: entry.description,
      date: dateStr,
      durationHours: Math.min(profile.hoursPerDay ?? 2, 2),
      completed: false,
    });
  }

  return tasks.length > 0 ? tasks : generateScheduleTasks(deadline, profile);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs always hold latest values — safe to use in async callbacks
  const profileRef = useRef<UserProfile | null>(null);
  const userIdRef = useRef<string | null | undefined>(null);
  profileRef.current = profile;
  userIdRef.current = userId;

  useEffect(() => {
    if (!authLoaded || !userId) return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const p = JSON.parse(raw) as UserProfile;
        profileRef.current = p;
        setProfile(p);
      }
    } catch {
      // ignore corrupt data
    }
    setIsLoaded(true);
  }, [authLoaded, userId]);

  const saveProfile = useCallback((p: UserProfile) => {
    const uid = userIdRef.current;
    if (!uid) return;
    localStorage.setItem(storageKey(uid), JSON.stringify(p));
    profileRef.current = p;
    setProfile(p);
  }, []);

  const resetProfile = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    localStorage.removeItem(storageKey(uid));
    profileRef.current = null;
    setProfile(null);
  }, []);

  const addScheduleTasks = useCallback((tasks: ScheduleTask[]) => {
    const p = profileRef.current;
    const uid = userIdRef.current;
    if (!p || !uid) return;
    const existing = p.scheduleTasks ?? [];
    const existingIds = new Set(existing.map((t) => t.id));
    const newTasks = tasks.filter((t) => !existingIds.has(t.id));
    if (newTasks.length === 0) return;
    const updated = { ...p, scheduleTasks: [...existing, ...newTasks] };
    localStorage.setItem(storageKey(uid), JSON.stringify(updated));
    profileRef.current = updated;
    setProfile(updated);
  }, []);

  const updateScheduleTask = useCallback((id: string, updates: Partial<ScheduleTask>) => {
    const p = profileRef.current;
    const uid = userIdRef.current;
    if (!p || !uid) return;
    const tasks = (p.scheduleTasks ?? []).map((t) =>
      t.id === id ? { ...t, ...updates } : t,
    );
    const updated = { ...p, scheduleTasks: tasks };
    localStorage.setItem(storageKey(uid), JSON.stringify(updated));
    profileRef.current = updated;
    setProfile(updated);
  }, []);

  const addResource = useCallback((resource: Resource) => {
    const p = profileRef.current;
    const uid = userIdRef.current;
    if (!p || !uid) return;
    const existing = (p.resources ?? []).filter((r) => r.deadlineId !== resource.deadlineId);
    const updated = { ...p, resources: [...existing, resource] };
    localStorage.setItem(storageKey(uid), JSON.stringify(updated));
    profileRef.current = updated;
    setProfile(updated);
  }, []);

  return (
    <UserContext.Provider
      value={{ profile, isLoaded, saveProfile, resetProfile, addScheduleTasks, updateScheduleTask, addResource }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
