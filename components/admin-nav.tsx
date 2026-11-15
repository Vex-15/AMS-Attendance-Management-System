'use client';

import AppNav from '@/components/app-nav';

interface AdminNavProps {
  userName: string;
  onLogout: () => void;
}

export default function AdminNav({ userName, onLogout }: AdminNavProps) {
  return <AppNav userName={userName} onLogout={onLogout} role="admin" />;
}
