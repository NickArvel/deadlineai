import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ChatProvider } from '@/context/ChatContext';
import { UserProvider } from '@/context/UserContext';

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
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} antialiased`}>
        <body className="h-screen overflow-hidden" style={{ background: '#F4F4F8' }}>
          <UserProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
