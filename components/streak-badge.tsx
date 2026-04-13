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
      .filter(([_, data]) => data.total > 0)
      .sort(([a], [b]) => a.localeCompare(b));

    if (sortedDates.length === 0) return { currentStreak: 0, maxStreak: 0 };

    let maxStreak = 0;
    let tempStreak = 0;

    for (const [_, data] of sortedDates) {
      if (data.present === data.total) { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak); }
      else { tempStreak = 0; }
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
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20">
        <Flame className="w-3.5 h-3.5" />
        {currentStreak}d streak
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
        <Trophy className="w-3.5 h-3.5" />
        Best: {maxStreak}d
      </div>
    </div>
  );
}
