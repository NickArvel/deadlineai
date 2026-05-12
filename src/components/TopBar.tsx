'use client';

import { usePathname } from 'next/navigation';
import { Plus, Bell } from 'lucide-react';

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

  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">{formatted}</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <button
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#534AB7' }}
        >
          <Plus size={16} />
          Add Deadline
        </button>
      </div>
    </header>
  );
}
