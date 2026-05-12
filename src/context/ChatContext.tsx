'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfile } from '@/context/UserContext';

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type ChatContextType = {
  messages: Message[];
  isLoading: boolean;
  pendingMessage: string | null;
  clearPending: () => void;
  sendMessage: (content: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | null>(null);

function now() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildWelcome(profile: UserProfile | null): Message {
  if (!profile) {
    return {
      id: 0,
      role: 'assistant',
      content: "Hi! I'm DeadlineAI, your personal study assistant. How can I help you today?",
      timestamp: now(),
    };
  }

  const active = profile.deadlines
    .filter((d) => new Date(d.dueDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const mostUrgent = active[0];
  const urgentLine = mostUrgent
    ? ` Your most urgent deadline is **${mostUrgent.task}** for ${mostUrgent.subject}.`
    : '';

  return {
    id: 0,
    role: 'assistant',
    content: `Hi ${profile.name}! 👋 I'm DeadlineAI, your personal study assistant. I can see you have **${active.length} upcoming deadline${active.length !== 1 ? 's' : ''}**.${urgentLine} How can I help you today?`,
    timestamp: now(),
  };
}

function getProfileFromStorage(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('deadlineai_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const welcomeIdRef = useRef<number>(0);
  const pathname = usePathname();
  const router = useRouter();

  // Initialize welcome message once on mount (after localStorage is available)
  useEffect(() => {
    const profile = getProfileFromStorage();
    const welcome = buildWelcome(profile);
    welcomeIdRef.current = welcome.id;
    setMessages([welcome]);
    messagesRef.current = [welcome];
  }, []);

  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      if (pathname !== '/chat') {
        setPendingMessage(content);
        router.push('/chat');
        return;
      }

      const timestamp = now();
      const userMsg: Message = { id: Date.now(), role: 'user', content, timestamp };
      const aiId = Date.now() + 1;
      const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsLoading(true);

      try {
        const welcomeId = welcomeIdRef.current;
        const apiMessages = [...messagesRef.current, userMsg]
          .filter((m) => m.id !== welcomeId && m.content !== '')
          .map((m) => ({ role: m.role, content: m.content }));

        const profile = getProfileFromStorage();

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, userProfile: profile }),
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, pathname, router],
  );

  const clearPending = useCallback(() => setPendingMessage(null), []);

  return (
    <ChatContext.Provider
      value={{ messages, isLoading, pendingMessage, clearPending, sendMessage }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
