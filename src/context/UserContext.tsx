'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export type Deadline = {
  id: string;
  subject: string;
  task: string;
  dueDate: string; // YYYY-MM-DD
};

export type UserProfile = {
  name: string;
  hoursPerDay: number;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  unavailableDays: string[];
  deadlines: Deadline[];
  onboardingComplete: boolean;
};

type UserContextType = {
  profile: UserProfile | null;
  isLoaded: boolean;
  saveProfile: (p: UserProfile) => void;
  resetProfile: () => void;
};

const UserContext = createContext<UserContextType | null>(null);

function storageKey(userId: string) {
  return `deadlineai_profile_${userId}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!authLoaded || !userId) return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // ignore corrupt data
    }
    setIsLoaded(true);
  }, [authLoaded, userId]);

  function saveProfile(p: UserProfile) {
    if (!userId) return;
    localStorage.setItem(storageKey(userId), JSON.stringify(p));
    setProfile(p);
  }

  function resetProfile() {
    if (!userId) return;
    localStorage.removeItem(storageKey(userId));
    setProfile(null);
  }

  return (
    <UserContext.Provider value={{ profile, isLoaded, saveProfile, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
