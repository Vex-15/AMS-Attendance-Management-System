'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut, Menu, X, LayoutDashboard, Settings } from 'lucide-react';
import { useState } from 'react';

interface AdminNavProps {
  userName: string;
  onLogout: () => void;
}

export default function AdminNav({ userName, onLogout }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    router.push('/');
  };

  const links = [
    { href: '/dashboard/admin', label: 'System Overview', icon: LayoutDashboard },
  ];

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard/admin" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">MITAOE</span>
            <p className="text-[10px] text-slate-400 -mt-0.5">Administration</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 font-medium">{userName}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-white/5">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-white/5 p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 transition" onClick={() => setMobileMenuOpen(false)}>
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-white/5 pt-3 mt-3">
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 py-2 px-3 rounded-lg hover:bg-white/5 transition w-full">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
