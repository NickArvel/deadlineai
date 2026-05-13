'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/schedule': 'Schedule',
  '/deadlines': 'Deadlines',
  '/chat': 'AI Chat',
  '/progress': 'Progress',
};

export default function TopBar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'Dashboard';

  const formatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 shrink-0">
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">{formatted}</p>
      </div>
    </header>
  );
}
