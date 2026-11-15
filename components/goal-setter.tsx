'use client';

import { useState, useEffect } from 'react';
import { Target, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface GoalSetterProps {
  studentId: string;
  analytics: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    stats: { totalPresent: number; totalLectures: number; percentage: number };
  }>;
}

function classesNeededForTarget(present: number, total: number, targetPct: number): number {
  if (total === 0) return 0;
  if ((present / total) * 100 >= targetPct) return 0;
  return Math.max(0, Math.ceil(((targetPct / 100) * total - present) / (1 - targetPct / 100)));
}

export default function GoalSetter({ studentId, analytics }: GoalSetterProps) {
  const storageKey = `mitaoe_goal_${studentId}`;
  const [goal, setGoal] = useState(75);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setGoal(Number(saved));
  }, [storageKey]);

  const handleGoalChange = (value: number[]) => {
    setGoal(value[0]);
    localStorage.setItem(storageKey, String(value[0]));
  };

  const totalNeeded = analytics.reduce(
    (sum, subject) =>
      sum + classesNeededForTarget(subject.stats.totalPresent, subject.stats.totalLectures, goal),
    0
  );

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <Target className="h-3.5 w-3.5 text-violet-300" />
            Attendance goal
          </h3>
          <p className="mt-1 text-[10.5px] text-slate-500">
            Classes required to reach your target
          </p>
        </div>
        <span className="tnum rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
          {goal}%
        </span>
      </div>

      <Slider
        value={[goal]}
        onValueChange={handleGoalChange}
        min={60}
        max={100}
        step={1}
        className="mt-4 w-full"
        aria-label="Attendance goal percentage"
      />

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">
          Classes needed
        </span>
        <span className="tnum text-[11px] font-semibold text-white">
          {totalNeeded === 0 ? 'On track' : `${totalNeeded} total`}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {analytics.map((subject) => {
          const needed = classesNeededForTarget(
            subject.stats.totalPresent,
            subject.stats.totalLectures,
            goal
          );
          return (
            <div
              key={subject.subjectId}
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5"
            >
              <span className="truncate text-[11px] text-slate-400">{subject.subjectCode}</span>
              {needed === 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-300">
                  <Check className="h-3 w-3" />
                  Met
                </span>
              ) : (
                <span className="tnum shrink-0 rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  +{needed}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
