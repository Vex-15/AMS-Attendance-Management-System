'use client';

import { useMemo, useState } from 'react';
import { X, AlertTriangle, TrendingUp, Flame } from 'lucide-react';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  stats: { percentage: number; status: 'safe' | 'warning' | 'at-risk' };
  classesNeeded: { classesNeeded: number };
  trend: { trend: 'improving' | 'declining' | 'stable'; estimatedPercentage: number };
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

const styles: Record<string, string> = {
  danger: 'border-rose-500/20 bg-rose-500/[0.07] text-rose-100',
  warning: 'border-amber-500/20 bg-amber-500/[0.07] text-amber-100',
  success: 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-100',
  info: 'border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-100',
};

const iconStyles: Record<string, string> = {
  danger: 'text-rose-300',
  warning: 'text-amber-300',
  success: 'text-emerald-300',
  info: 'text-indigo-300',
};

export default function NotificationsPanel({
  analytics,
  currentStreak = 0,
}: NotificationsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];

    analytics.forEach((subject) => {
      if (subject.trend.trend === 'declining') {
        const drop = Math.round(subject.stats.percentage - subject.trend.estimatedPercentage);
        if (drop > 0) {
          notifs.push({
            id: `decline-${subject.subjectId}`,
            type: 'danger',
            message: `${subject.subjectName} may drop by ${drop}% at the current rate`,
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
          });
        }
      }
      if (subject.trend.trend === 'improving' && subject.stats.percentage > 75) {
        notifs.push({
          id: `improve-${subject.subjectId}`,
          type: 'success',
          message: `${subject.subjectName} attendance is trending up`,
          icon: <TrendingUp className="h-3.5 w-3.5" />,
        });
      }
    });

    if (currentStreak >= 5) {
      notifs.push({
        id: 'streak',
        type: 'info',
        message: `${currentStreak}-day attendance streak — keep it going`,
        icon: <Flame className="h-3.5 w-3.5" />,
      });
    }

    return notifs;
  }, [analytics, currentStreak]);

  const visible = notifications.filter((n) => !dismissedIds.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.slice(0, 3).map((notif, index) => (
        <div
          key={notif.id}
          className={`animate-slide-up flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 ${styles[notif.type]}`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`shrink-0 ${iconStyles[notif.type]}`}>{notif.icon}</span>
            <span className="line-clamp-2 text-[11.5px] leading-relaxed">{notif.message}</span>
          </div>
          <button
            onClick={() => setDismissedIds((prev) => new Set([...prev, notif.id]))}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
