'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface GoalSetterProps {
  studentId: string;
  analytics: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    stats: { totalPresent: number; totalLectures: number; percentage: number; };
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

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-violet-400" /> Goal: {goal}%
      </h3>

      <Slider value={[goal]} onValueChange={handleGoalChange} min={60} max={100} step={1} className="w-full mb-4" />

      <div className="space-y-2 pt-3 border-t border-white/5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">Classes needed</p>
        {analytics.map((subject) => {
          const needed = classesNeededForTarget(subject.stats.totalPresent, subject.stats.totalLectures, goal);
          return (
            <div key={subject.subjectId} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate mr-2">{subject.subjectCode}</span>
              {needed === 0 ? (
                <span className="text-emerald-400 font-medium text-[10px]">✓ Met</span>
              ) : (
                <span className="text-orange-400 font-semibold">{needed}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
