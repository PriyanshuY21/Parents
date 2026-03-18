import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Microscope,
  History,
  GitCompare,
  User,
  LogOut,
  CircleDot,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/analyze', label: 'Analyze Report', Icon: Microscope },
  { path: '/history', label: 'Report History', Icon: History },
  { path: '/compare', label: 'Compare Reports', Icon: GitCompare },
];

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <button
          onClick={() => navigate('/analyze')}
          className="text-white text-xl font-light tracking-tight hover:opacity-80 transition-opacity"
        >
          Health<strong className="font-bold">Lens</strong>
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 bg-[--hl-teal] text-white flex-shrink-0">
            <AvatarFallback className="bg-[#0D8A6E] text-white text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/50 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ path, label, Icon }) => (
          <button
            key={path}
            onClick={() => { navigate(path); setMobileOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left',
              pathname === path
                ? 'bg-[#1E3148] text-white border-l-[3px] border-[#0D8A6E] pl-[calc(0.75rem-3px)]'
                : 'text-white/70 hover:bg-[#1E3148] hover:text-white'
            )}
            aria-current={pathname === path ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}

        <Separator className="my-2 bg-white/10" />

        <button
          onClick={() => { navigate('/profile'); setMobileOpen(false); }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-left',
            pathname === '/profile'
              ? 'bg-[#1E3148] text-white border-l-[3px] border-[#0D8A6E] pl-[calc(0.75rem-3px)]'
              : 'text-white/70 hover:bg-[#1E3148] hover:text-white'
          )}
          aria-current={pathname === '/profile' ? 'page' : undefined}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          My Profile
        </button>
      </nav>

      {/* Bottom: logout + HIPAA */}
      <div className="px-2 pb-3 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/70 hover:bg-[#1E3148] hover:text-white transition-colors text-left"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
        <div className="px-3 py-2 flex items-center gap-1.5">
          <CircleDot className="h-3 w-3 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] text-white/40 leading-snug">
            No reports stored · HIPAA-aware
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-[#0D1B2A]">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0D1B2A] border-b border-white/10">
        <span className="text-white text-lg font-light">
          Health<strong className="font-bold">Lens</strong>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#0D1B2A] transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-14 flex items-center px-5 border-b border-white/10">
          <span className="text-white text-lg font-light">
            Health<strong className="font-bold">Lens</strong>
          </span>
        </div>
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="pt-14 lg:pt-0 px-6 py-8 max-w-screen-xl" id="main-content" role="main">
          {children}
        </div>
      </main>
    </div>
  );
}
