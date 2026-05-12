'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

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

const WELCOME: Message = {
  id: 0,
  role: 'assistant',
  content:
    "Hi Alex! 👋 I'm DeadlineAI, your personal study assistant. I've analysed your upcoming deadlines — you have **4 assignments due this week**, with your Linear Algebra problem set being the most urgent (due **tonight at 11:59 PM**). How can I help you today?",
  timestamp: now(),
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>([WELCOME]);
  const pathname = usePathname();
  const router = useRouter();

  // Keep ref in sync so sendMessage always sees the latest messages
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // If not on chat page, navigate there first — the page will pick up pendingMessage
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
        const apiMessages = [...messagesRef.current, userMsg]
          .filter((m) => m.id !== WELCOME.id && m.content !== '')
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
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
