'use client';

import AppNav from '@/components/app-nav';

interface StudentNavProps {
  userName: string;
  onLogout: () => void;
}

export default function StudentNav({ userName, onLogout }: StudentNavProps) {
  return <AppNav userName={userName} onLogout={onLogout} role="student" />;
}
