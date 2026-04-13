'use client';

import { useMemo, useState } from 'react';
import { X, AlertTriangle, AlertCircle, TrendingUp, Flame } from 'lucide-react';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  stats: { percentage: number; status: 'safe' | 'warning' | 'at-risk'; };
  classesNeeded: { classesNeeded: number; };
  trend: { trend: 'improving' | 'declining' | 'stable'; estimatedPercentage: number; };
}

interface NotificationsPanelProps {
  analytics: SubjectAnalytics[];
  currentStreak?: number;
}

interface Notification {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  message: string;
  icon: React.ReactNode;
}

export default function NotificationsPanel({ analytics, currentStreak = 0 }: NotificationsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];

    analytics.forEach((subject) => {
      if (subject.trend.trend === 'declining') {
        const drop = Math.round(subject.stats.percentage - subject.trend.estimatedPercentage);
        if (drop > 0) {
          notifs.push({ id: `decline-${subject.subjectId}`, type: 'danger',
            message: `${subject.subjectName} may drop by ${drop}% at current rate`,
            icon: <AlertTriangle className="w-4 h-4" /> });
        }
      }
      if (subject.stats.status === 'at-risk' && subject.classesNeeded.classesNeeded > 0) {
        notifs.push({ id: `risk-${subject.subjectId}`, type: 'warning',
          message: `Need ${subject.classesNeeded.classesNeeded} more classes in ${subject.subjectName} for 75%`,
          icon: <AlertCircle className="w-4 h-4" /> });
      }
      if (subject.trend.trend === 'improving' && subject.stats.percentage > 75) {
        notifs.push({ id: `improve-${subject.subjectId}`, type: 'success',
          message: `${subject.subjectName} attendance is improving`,
          icon: <TrendingUp className="w-4 h-4" /> });
      }
    });

    if (currentStreak >= 5) {
      notifs.push({ id: 'streak', type: 'info',
        message: `${currentStreak}-day streak! Keep it going 🔥`,
        icon: <Flame className="w-4 h-4" /> });
    }

    return notifs;
  }, [analytics, currentStreak]);

  const visible = notifications.filter((n) => !dismissedIds.has(n.id));
  if (visible.length === 0) return null;

  const getStyle = (type: string) => {
    switch (type) {
      case 'danger': return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
      default: return '';
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {visible.slice(0, 3).map((notif) => (
        <div key={notif.id} className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs animate-slide-up ${getStyle(notif.type)}`}>
          <div className="flex items-center gap-2 min-w-0">
            {notif.icon}
            <span className="truncate">{notif.message}</span>
          </div>
          <button onClick={() => setDismissedIds((prev) => new Set([...prev, notif.id]))} className="shrink-0 hover:opacity-60 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
