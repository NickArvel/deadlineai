'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BellDot,
  MessageSquare,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile } = useUser();

  const deadlineCount = profile?.deadlines?.length ?? 0;
  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/deadlines', label: 'Deadlines', icon: BellDot, badge: deadlineCount > 0 ? String(deadlineCount) : undefined },
    { href: '/chat', label: 'AI Chat', icon: MessageSquare, dot: true },
    { href: '/progress', label: 'Progress', icon: BarChart3 },
  ];

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#534AB7' }}
          >
            <Zap size={15} stroke="white" fill="white" />
          </div>
          <span className="font-bold text-gray-900 text-[15px] tracking-tight">
            DeadlineAI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
          Main Menu
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-[#534AB7]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={isActive ? { backgroundColor: '#EEEDFE' } : {}}
              >
                <Icon
                  size={17}
                  className={isActive ? 'text-[#534AB7]' : 'text-gray-400'}
                  style={isActive ? { color: '#534AB7' } : {}}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: '#534AB7' }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.dot && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 mx-3 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
          <p className="text-xs font-semibold text-gray-700">Pro Tip</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Study in 90-min blocks with 15-min breaks for peak focus.
          </p>
        </div>
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #534AB7 0%, #6B62C8 100%)' }}
          >
            {profile?.name ? profile.name[0].toUpperCase() : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name ?? 'Student'}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{profile?.preferredTime ?? ''} learner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
