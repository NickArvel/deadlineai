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
import { useAuth } from '@clerk/nextjs';
import { UserProfile, useUser } from '@/context/UserContext';

export type DeadlineAction = {
  subject: string;
  task: string;
  dueDate: string;
  type?: 'assignment' | 'exam' | 'project' | 'other';
};

export type SearchResult = {
  title: string;
  url: string;
  description: string;
  source: string;
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  date: string; // YYYY-MM-DD for date dividers
  attachedFileName?: string;
  action?: DeadlineAction;
  actionSaved?: boolean;
  searchResults?: SearchResult[];
};

export type AttachedFile = {
  name: string;
  mimeType: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[]; // excludes welcome message
  createdAt: string;
  updatedAt: string;
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
  sessions: ChatSession[];
  currentSessionId: string | null;
  startNewChat: () => void;
  loadSession: (id: string) => void;
  markActionSaved: (messageId: number) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function newSessionId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function sessionsKey(userId: string) {
  return `deadlineai_chats_${userId}`;
}

function buildWelcome(profile: UserProfile | null): Message {
  const date = todayStr();
  const timestamp = nowTime();

  if (!profile) {
    return {
      id: -1,
      role: 'assistant',
      content: "Hi! I'm DeadlineAI, your personal study assistant. How can I help you today?",
      timestamp,
      date,
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
    id: -1,
    role: 'assistant',
    content: `Hi ${profile.name}! 👋 I'm DeadlineAI, your personal study assistant. I can see you have **${active.length} upcoming deadline${active.length !== 1 ? 's' : ''}**.${urgentLine} How can I help you today?`,
    timestamp,
    date,
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

function parseDeadlineAction(content: string): { action: DeadlineAction | null; cleaned: string } {
  const markerStart = content.indexOf('[DEADLINE_ACTION:');
  if (markerStart === -1) return { action: null, cleaned: content };

  const jsonStart = content.indexOf('{', markerStart);
  if (jsonStart === -1) return { action: null, cleaned: content };

  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }

  if (jsonEnd === -1) return { action: null, cleaned: content };

  try {
    const jsonStr = content.slice(jsonStart, jsonEnd + 1);
    const action = JSON.parse(jsonStr) as DeadlineAction;
    const markerEnd = content.indexOf(']', jsonEnd);
    const cleaned = (
      content.slice(0, markerStart) +
      (markerEnd !== -1 ? content.slice(markerEnd + 1) : '')
    ).trim();
    return { action, cleaned };
  } catch {
    return { action: null, cleaned: content };
  }
}

function parseSearchQuery(content: string): { query: string | null; cleaned: string } {
  const match = content.match(/\[SEARCH:"([^"]+)"\]/);
  if (!match) return { query: null, cleaned: content };
  const query = match[1];
  const cleaned = content.replace(match[0], '').trim();
  return { query, cleaned };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { profile, isLoaded } = useUser();
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const messagesRef = useRef<Message[]>([]);
  const pendingFileDataRef = useRef<{ name: string; data: string; mimeType: string } | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Keep refs in sync
  messagesRef.current = messages;
  currentSessionIdRef.current = currentSessionId;

  // Load sessions and init welcome on mount
  useEffect(() => {
    if (!isLoaded || !userId || initialized) return;

    let loadedSessions: ChatSession[] = [];
    try {
      const raw = localStorage.getItem(sessionsKey(userId));
      if (raw) loadedSessions = JSON.parse(raw);
    } catch { /* ignore */ }

    setSessions(loadedSessions);

    const welcome = buildWelcome(profile);
    setMessages([welcome]);
    messagesRef.current = [welcome];
    setInitialized(true);
  }, [isLoaded, userId, initialized, profile]);

  // Persist sessions to localStorage
  useEffect(() => {
    if (!userId || !initialized) return;
    try {
      localStorage.setItem(sessionsKey(userId), JSON.stringify(sessions.slice(0, 20)));
    } catch { /* ignore */ }
  }, [sessions, userId, initialized]);

  // Auto-save current chat session when messages settle (not while loading)
  useEffect(() => {
    if (!initialized || !userId || isLoading) return;

    const nonWelcome = messages.filter((m) => m.id !== -1 && m.content !== '');
    if (nonWelcome.length === 0) return;

    const sid = currentSessionIdRef.current;
    if (!sid) return;

    const firstUser = nonWelcome.find((m) => m.role === 'user');
    const title = firstUser
      ? firstUser.content.slice(0, 60) + (firstUser.content.length > 60 ? '…' : '')
      : 'Chat';

    const nowIso = new Date().toISOString();

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sid);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], messages: nonWelcome, updatedAt: nowIso, title };
        return updated;
      }
      return [
        { id: sid, title, messages: nonWelcome, createdAt: nowIso, updatedAt: nowIso },
        ...prev.slice(0, 19),
      ];
    });
  }, [messages, isLoading, initialized, userId]);

  const attachFile = useCallback(async (file: File) => {
    const data = await fileToBase64(file);
    pendingFileDataRef.current = { name: file.name, data, mimeType: file.type };
    setAttachedFile({ name: file.name, mimeType: file.type });
  }, []);

  const clearAttachment = useCallback(() => {
    pendingFileDataRef.current = null;
    setAttachedFile(null);
  }, []);

  const startNewChat = useCallback(() => {
    const welcome = buildWelcome(profile);
    setMessages([welcome]);
    messagesRef.current = [welcome];
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
    if (pathname !== '/chat') router.push('/chat');
  }, [profile, pathname, router]);

  const loadSession = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return;

      const welcome = buildWelcome(profile);
      const allMessages = [welcome, ...session.messages];
      setMessages(allMessages);
      messagesRef.current = allMessages;
      currentSessionIdRef.current = id;
      setCurrentSessionId(id);
      router.push('/chat');
    },
    [sessions, profile, router],
  );

  const markActionSaved = useCallback((messageId: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, actionSaved: true } : m)),
    );
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if ((!content.trim() && !pendingFileDataRef.current) || isLoading) return;

      const fileToSend = pendingFileDataRef.current;
      pendingFileDataRef.current = null;
      setAttachedFile(null);

      if (pathname !== '/chat') {
        setPendingMessage(content);
        router.push('/chat');
        return;
      }

      // Ensure session ID exists
      if (!currentSessionIdRef.current) {
        const sid = newSessionId();
        currentSessionIdRef.current = sid;
        setCurrentSessionId(sid);
      }

      const timestamp = nowTime();
      const date = todayStr();
      const userMsg: Message = {
        id: Date.now(),
        role: 'user',
        content,
        timestamp,
        date,
        attachedFileName: fileToSend?.name,
      };
      const aiId = Date.now() + 1;
      const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp, date };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsLoading(true);

      let accumulated = '';

      try {
        const apiMessages = [...messagesRef.current, userMsg]
          .filter((m) => m.id !== -1 && m.content !== '')
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
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: accumulated } : m)),
          );
        }

        // Parse markers from completed response
        let finalContent = accumulated;
        let action: DeadlineAction | undefined;
        let searchResults: SearchResult[] | undefined;

        const { action: parsedAction, cleaned: afterAction } = parseDeadlineAction(finalContent);
        if (parsedAction) {
          action = parsedAction;
          finalContent = afterAction;
        }

        const { query, cleaned: afterSearch } = parseSearchQuery(finalContent);
        if (query) {
          finalContent = afterSearch;
          try {
            const searchRes = await fetch('/api/tavily-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query }),
            });
            if (searchRes.ok) {
              const data = await searchRes.json();
              searchResults = data.results ?? [];
            }
          } catch { /* ignore */ }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? { ...m, content: finalContent, action, searchResults }
              : m,
          ),
        );
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
        sessions,
        currentSessionId,
        startNewChat,
        loadSession,
        markActionSaved,
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
