'use client';

import { useMemo } from 'react';
import { Flame, Trophy } from 'lucide-react';

interface StreakBadgeProps {
  attendanceHistory: Record<string, Array<{ date: string; status: 'present' | 'absent' }>>;
}

export default function StreakBadge({ attendanceHistory }: StreakBadgeProps) {
  const { currentStreak, maxStreak } = useMemo(() => {
    const dateMap = new Map<string, { total: number; present: number }>();

    Object.values(attendanceHistory).forEach((records) => {
      records.forEach((record) => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) dateMap.set(dateKey, { total: 0, present: 0 });
        const entry = dateMap.get(dateKey)!;
        entry.total++;
        if (record.status === 'present') entry.present++;
      });
    });

    const sortedDates = Array.from(dateMap.entries())
      .filter(([, data]) => data.total > 0)
      .sort(([a], [b]) => a.localeCompare(b));

    if (sortedDates.length === 0) return { currentStreak: 0, maxStreak: 0 };

    let maxStreak = 0;
    let tempStreak = 0;

    for (const [, data] of sortedDates) {
      if (data.present === data.total) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    let currentStreak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      if (sortedDates[i][1].present === sortedDates[i][1].total) currentStreak++;
      else break;
    }

    return { currentStreak, maxStreak };
  }, [attendanceHistory]);

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-semibold text-orange-200">
        <Flame className={`h-3.5 w-3.5 ${currentStreak > 0 ? 'animate-bob' : 'opacity-50'}`} />
        <span className="tnum">{currentStreak}d</span>
        <span className="hidden font-medium text-orange-200/60 sm:inline">streak</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-200">
        <Trophy className="h-3.5 w-3.5" />
        <span className="hidden font-medium text-violet-200/60 sm:inline">Best</span>
        <span className="tnum">{maxStreak}d</span>
      </div>
    </div>
  );
}
