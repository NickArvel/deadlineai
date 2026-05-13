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
import { UserProfile, useUser } from '@/context/UserContext';

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedFileName?: string;
};

export type AttachedFile = {
  name: string;
  mimeType: string;
};

type ChatContextType = {
  messages: Message[];
  isLoading: boolean;
  pendingMessage: string | null;
  clearPending: () => void;
  sendMessage: (content: string) => Promise<void>;
  attachedFile: AttachedFile | null;
  attachFile: (file: File) => Promise<void>;
  clearAttachment: () => void;
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { profile, isLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [welcomeSet, setWelcomeSet] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const welcomeIdRef = useRef<number>(0);
  // Store full file data in a ref so sendMessage can access it without re-creating
  const pendingFileDataRef = useRef<{ name: string; data: string; mimeType: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || welcomeSet) return;
    const welcome = buildWelcome(profile);
    welcomeIdRef.current = welcome.id;
    setMessages([welcome]);
    messagesRef.current = [welcome];
    setWelcomeSet(true);
  }, [isLoaded, welcomeSet, profile]);

  messagesRef.current = messages;

  const attachFile = useCallback(async (file: File) => {
    const data = await fileToBase64(file);
    pendingFileDataRef.current = { name: file.name, data, mimeType: file.type };
    setAttachedFile({ name: file.name, mimeType: file.type });
  }, []);

  const clearAttachment = useCallback(() => {
    pendingFileDataRef.current = null;
    setAttachedFile(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Grab and clear the pending file before any async work
      const fileToSend = pendingFileDataRef.current;
      pendingFileDataRef.current = null;
      setAttachedFile(null);

      if (pathname !== '/chat') {
        setPendingMessage(content);
        router.push('/chat');
        return;
      }

      const timestamp = now();
      const userMsg: Message = {
        id: Date.now(),
        role: 'user',
        content,
        timestamp,
        attachedFileName: fileToSend?.name,
      };
      const aiId = Date.now() + 1;
      const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsLoading(true);

      try {
        const welcomeId = welcomeIdRef.current;
        const apiMessages = [...messagesRef.current, userMsg]
          .filter((m) => m.id !== welcomeId && m.content !== '')
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            userProfile: profile,
            fileAttachment: fileToSend ?? null,
          }),
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
    [isLoading, pathname, router, profile],
  );

  const clearPending = useCallback(() => setPendingMessage(null), []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        pendingMessage,
        clearPending,
        sendMessage,
        attachedFile,
        attachFile,
        clearAttachment,
      }}
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
