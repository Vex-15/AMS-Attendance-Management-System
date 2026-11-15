'use client';

import AppNav from '@/components/app-nav';

interface TeacherNavProps {
  userName: string;
  onLogout: () => void;
}

export default function TeacherNav({ userName, onLogout }: TeacherNavProps) {
  return <AppNav userName={userName} onLogout={onLogout} role="teacher" />;
}
