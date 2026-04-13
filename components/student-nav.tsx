'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart3, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

interface StudentNavProps {
  userName: string;
  onLogout: () => void;
}

export default function StudentNav({ userName, onLogout }: StudentNavProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    router.push('/');
  };

  return (
    <nav className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
            MA
          </div>
          <div>
            <Link href="/dashboard/student" className="font-bold text-lg hover:opacity-80">
              MITAOE
            </Link>
            <p className="text-xs text-sidebar-foreground/60">Student Portal</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard/student" className="text-sm hover:text-sidebar-primary transition">
            Dashboard
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="text-sm">
            <p className="font-medium">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60">Student</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-sidebar-accent/10 border-t border-sidebar-border p-4 space-y-4">
          <Link href="/dashboard/student" className="block text-sm hover:text-sidebar-primary">
            Dashboard
          </Link>
          <div className="border-t border-sidebar-border pt-4">
            <p className="text-sm font-medium mb-3">{userName}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
