'use client';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ChatBar from '@/components/ChatBar';
import OnboardingFlow from '@/components/OnboardingFlow';
import { useUser } from '@/context/UserContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#F4F4F8' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#534AB7] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile?.onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <ChatBar />
      </div>
    </div>
  );
}
