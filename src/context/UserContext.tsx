'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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

const STORAGE_KEY = 'deadlineai_profile';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // ignore corrupt data
    }
    setIsLoaded(true);
  }, []);

  function saveProfile(p: UserProfile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  }

  function resetProfile() {
    localStorage.removeItem(STORAGE_KEY);
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
