'use client';

import { useMemo } from 'react';
import { format, subWeeks, startOfWeek, addDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  subjectName: string;
  subjectCode: string;
}

interface AttendanceHeatmapProps {
  attendanceHistory: Record<string, AttendanceRecord[]>;
}

export default function AttendanceHeatmap({ attendanceHistory }: AttendanceHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const weeksCount = 12;
    const startDate = startOfWeek(subWeeks(today, weeksCount - 1), { weekStartsOn: 1 });

    // Flatten all records into a date map
    const dateMap = new Map<string, { present: string[]; absent: string[]; total: number }>();

    Object.values(attendanceHistory).forEach((records) => {
      records.forEach((record) => {
        const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { present: [], absent: [], total: 0 });
        }
        const entry = dateMap.get(dateKey)!;
        entry.total++;
        if (record.status === 'present') {
          entry.present.push(record.subjectName);
        } else {
          entry.absent.push(record.subjectName);
        }
      });
    });

    // Build weeks grid
    const weeks: Array<Array<{
      date: Date;
      dateKey: string;
      percentage: number; // 0-100 attendance that day
      presentCount: number;
      absentCount: number;
      totalCount: number;
      subjects: { present: string[]; absent: string[] };
      hasClass: boolean;
    }>> = [];

    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = '';

    for (let w = 0; w < weeksCount; w++) {
      const week: typeof weeks[0] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, w * 7 + d);
        const dateKey = format(date, 'yyyy-MM-dd');
        const entry = dateMap.get(dateKey);

        // Track month labels
        if (d === 0) {
          const monthName = format(date, 'MMM');
          if (monthName !== lastMonth) {
            monthLabels.push({ label: monthName, colIndex: w });
            lastMonth = monthName;
          }
        }

        const hasClass = !!entry && entry.total > 0;
        const presentCount = entry?.present.length || 0;
        const totalCount = entry?.total || 0;
        const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : -1;

        week.push({
          date,
          dateKey,
          percentage,
          presentCount,
          absentCount: entry?.absent.length || 0,
          totalCount,
          subjects: entry || { present: [], absent: [] },
          hasClass,
        });
      }
      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, [attendanceHistory]);

  const getCellColor = (pct: number, hasClass: boolean) => {
    if (!hasClass) return 'bg-white/[0.03]';
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-emerald-500/70';
    if (pct >= 50) return 'bg-yellow-500/70';
    if (pct >= 25) return 'bg-orange-500/70';
    return 'bg-red-500/70';
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  return (
    <TooltipProvider delayDuration={80}>
      <div className="space-y-3">
        {/* Month labels row */}
        <div className="flex gap-[3px] pl-8">
          {(() => {
            const cells: React.ReactNode[] = [];
            let labelIdx = 0;
            for (let w = 0; w < 12; w++) {
              const ml = monthLabels.find(m => m.colIndex === w);
              cells.push(
                <div key={w} className="w-[14px] text-center">
                  <span className="text-[9px] text-slate-500 font-medium">
                    {ml ? ml.label : ''}
                  </span>
                </div>
              );
            }
            return cells;
          })()}
        </div>

        <div className="flex gap-0">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] mr-2 shrink-0">
            {dayLabels.map((day, i) => (
              <div key={i} className="h-[14px] flex items-center justify-end pr-1">
                <span className="text-[9px] text-slate-500 font-medium">{day}</span>
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <Tooltip key={day.dateKey}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-all duration-200 hover:scale-125 hover:ring-1 hover:ring-white/30 ${getCellColor(day.percentage, day.hasClass)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="glass-card rounded-lg px-3 py-2 max-w-xs border-white/10">
                      <p className="font-semibold text-xs text-white">{format(day.date, 'EEEE, dd MMM yyyy')}</p>
                      {!day.hasClass ? (
                        <p className="text-[11px] text-slate-400 mt-1">No classes scheduled</p>
                      ) : (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[11px] text-slate-300">
                            {day.presentCount}/{day.totalCount} classes attended ({Math.round(day.percentage)}%)
                          </p>
                          {day.subjects.present.map((s, i) => (
                            <p key={`p-${i}`} className="text-[11px] text-emerald-400">✓ {s}</p>
                          ))}
                          {day.subjects.absent.map((s, i) => (
                            <p key={`a-${i}`} className="text-[11px] text-red-400">✗ {s}</p>
                          ))}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 pt-1 pl-8">
          <span className="text-[10px] text-slate-500">Less</span>
          <div className="flex gap-[2px]">
            <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.03]" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-red-500/70" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-orange-500/70" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-yellow-500/70" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/70" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-500">More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
