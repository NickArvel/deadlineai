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

export function generateScheduleTasks(deadline: Deadline, profile: UserProfile): ScheduleTask[] {
  const unavailDow = (profile.unavailableDays ?? []).map((d) => UNAVAIL_DOW[d] ?? -1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline.dueDate);
  due.setHours(0, 0, 0, 0);

  const tasks: ScheduleTask[] = [];
  const current = new Date(today);

  while (current < due) {
    if (!unavailDow.includes(current.getDay())) {
      const dateStr = current.toISOString().slice(0, 10);
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
