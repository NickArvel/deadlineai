import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ChatBar from '@/components/ChatBar';
import { ChatProvider } from '@/context/ChatContext';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DeadlineAI – Anti-Procrastination Study Planner',
  description:
    'An AI-powered study planner that helps students beat procrastination and hit every deadline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body className="h-screen overflow-hidden" style={{ background: '#F4F4F8' }}>
        <ChatProvider>
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-0">
              <TopBar />
              <main className="flex-1 overflow-y-auto">{children}</main>
              <ChatBar />
            </div>
          </div>
        </ChatProvider>
      </body>
    </html>
  );
}
