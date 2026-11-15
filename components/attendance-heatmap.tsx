'use client';

import { useMemo, useState } from 'react';
import { format, subWeeks, startOfWeek, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  subjectName: string;
  subjectCode: string;
  lectureId?: string;
  lectureNumber?: number;
}

interface AttendanceHeatmapProps {
  attendanceHistory: Record<string, AttendanceRecord[]>;
}

interface HeatmapDay {
  date: Date;
  dateKey: string;
  percentage: number;
  presentCount: number;
  absentCount: number;
  totalCount: number;
  records: AttendanceRecord[];
  hasClass: boolean;
  isToday: boolean;
}

interface HeatmapSummary {
  totalClasses: number;
  attended: number;
  rate: number;
  currentStreak: number;
  bestStreak: number;
  classDays: number;
}

const WEEKS = 12;

function dayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export default function AttendanceHeatmap({ attendanceHistory }: AttendanceHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  const { weeks, monthLabels, summary } = useMemo(() => {
    const today = new Date();
    const todayKey = dayKey(today);
    const startDate = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 1 });

    // Flatten all records into a date map.
    const dateMap = new Map<string, AttendanceRecord[]>();
    Object.values(attendanceHistory).forEach((records) => {
      records.forEach((record) => {
        const key = dayKey(new Date(record.date));
        if (!dateMap.has(key)) dateMap.set(key, []);
        dateMap.get(key)!.push(record);
      });
    });

    // Build the weeks grid.
    const weeks: HeatmapDay[][] = [];
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = '';

    for (let w = 0; w < WEEKS; w++) {
      const week: HeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, w * 7 + d);
        const key = dayKey(date);
        const records = dateMap.get(key) || [];
        const hasClass = records.length > 0;
        const presentCount = records.filter((r) => r.status === 'present').length;
        const totalCount = records.length;
        const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : -1;

        if (d === 0) {
          const monthName = format(date, 'MMM');
          if (monthName !== lastMonth) {
            monthLabels.push({ label: monthName, colIndex: w });
            lastMonth = monthName;
          }
        }

        week.push({
          date,
          dateKey: key,
          percentage,
          presentCount,
          absentCount: totalCount - presentCount,
          totalCount,
          records,
          hasClass,
          isToday: key === todayKey,
        });
      }
      weeks.push(week);
    }

    // Summary stats + streaks (consecutive class days with 100% attendance).
    const classDays: HeatmapDay[] = weeks.flat().filter((day) => day.hasClass);
    const totalClasses = classDays.reduce((sum, day) => sum + day.totalCount, 0);
    const attended = classDays.reduce((sum, day) => sum + day.presentCount, 0);

    const sortedClassDays = [...classDays].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    let bestStreak = 0;
    let running = 0;
    let prevTime: number | null = null;
    for (const day of sortedClassDays) {
      const isPerfect = day.percentage >= 100;
      const isConsecutive =
        prevTime !== null && day.date.getTime() - prevTime <= 24 * 60 * 60 * 1000 * 2;
      if (isPerfect && (prevTime === null || isConsecutive)) {
        running += 1;
      } else if (isPerfect) {
        running = 1;
      } else {
        running = 0;
      }
      bestStreak = Math.max(bestStreak, running);
      prevTime = day.date.getTime();
    }

    // Current streak: walk backwards from the most recent class day.
    let currentStreak = 0;
    for (let i = sortedClassDays.length - 1; i >= 0; i--) {
      if (sortedClassDays[i].percentage >= 100) currentStreak += 1;
      else break;
    }

    const summary: HeatmapSummary = {
      totalClasses,
      attended,
      rate: totalClasses > 0 ? (attended / totalClasses) * 100 : 0,
      currentStreak,
      bestStreak,
      classDays: classDays.length,
    };

    return { weeks, monthLabels, summary };
  }, [attendanceHistory]);

  const getCellColor = (day: HeatmapDay) => {
    if (!day.hasClass) return 'bg-slate-100 dark:bg-white/[0.04]';
    const pct = day.percentage;
    if (pct >= 100) return 'bg-emerald-500 dark:bg-emerald-400';
    if (pct >= 80) return 'bg-emerald-400/80 dark:bg-emerald-500/75';
    if (pct >= 60) return 'bg-amber-400/85 dark:bg-amber-400/70';
    if (pct >= 40) return 'bg-orange-500/80 dark:bg-orange-500/70';
    return 'bg-rose-500/85 dark:bg-rose-500/75';
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <TooltipProvider delayDuration={60}>
      <div className="space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Classes', value: summary.totalClasses.toLocaleString() },
            { label: 'Attended', value: summary.attended.toLocaleString() },
            { label: 'Rate', value: `${Math.round(summary.rate)}%` },
            { label: 'Best streak', value: `${summary.bestStreak}d` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-black/[0.06] bg-black/[0.02] px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Month labels row */}
        <div className="flex gap-1.5 pl-10 sm:gap-2">
          {Array.from({ length: WEEKS }).map((_, w) => {
            const ml = monthLabels.find((m) => m.colIndex === w);
            return (
              <div key={w} className="w-6 text-center sm:w-7">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {ml ? ml.label : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          {/* Day-of-week labels */}
          <div className="mr-2 flex shrink-0 flex-col gap-1.5 sm:gap-2">
            {dayLabels.map((day, i) => (
              <div key={i} className="flex h-6 items-center justify-end pr-1 sm:h-7">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{day}</span>
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1.5 sm:gap-2">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5 sm:gap-2">
                {week.map((day) => (
                  <Tooltip key={day.dateKey}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        aria-label={
                          day.hasClass
                            ? `${format(day.date, 'EEEE, dd MMM yyyy')}: ${day.presentCount} of ${day.totalCount} classes attended, ${Math.round(day.percentage)}%`
                            : `${format(day.date, 'EEEE, dd MMM yyyy')}: no classes scheduled`
                        }
                        className={`block h-6 w-6 appearance-none rounded-md border-0 p-0 ring-1 ring-inset transition-all duration-150 hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:h-7 sm:w-7 ${getCellColor(day)} ${day.isToday ? 'ring-indigo-400 dark:ring-indigo-300' : 'ring-black/[0.08] dark:ring-white/[0.08]'}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      collisionPadding={12}
                      className="z-[100] w-64 max-w-[calc(100vw-2rem)] whitespace-normal break-words rounded-xl border border-white/12 bg-[#0a0d16]/97 px-3.5 py-3 text-left text-slate-100 shadow-2xl backdrop-blur"
                    >
                      <p className="text-sm font-semibold leading-snug text-white">
                        {format(day.date, 'EEEE, dd MMM yyyy')}
                      </p>
                      {!day.hasClass ? (
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">No classes scheduled</p>
                      ) : (
                        <div className="mt-1.5 space-y-1">
                          <p className="text-xs leading-relaxed text-slate-200">
                            {day.presentCount} of {day.totalCount} classes attended · {Math.round(day.percentage)}%
                          </p>
                          {day.records.map((record, i) => (
                            <p
                              key={record.lectureId || `${record.subjectCode}-${i}`}
                              className={`break-words text-xs leading-relaxed ${record.status === 'present' ? 'text-emerald-300' : 'text-rose-300'}`}
                            >
                              {record.status === 'present' ? '✓' : '✗'} {record.subjectName}
                              {record.lectureNumber ? ` · L${record.lectureNumber}` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}</div>
            ))}
          </div>
        </div>

        {/* Color legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-10 pt-1">
          <span className="text-[10.5px] font-medium text-slate-500">Less</span>
          <div className="flex items-center gap-1" aria-hidden="true">
            <div className="h-3 w-3 rounded-[3px] bg-slate-100 ring-1 ring-black/10 dark:bg-white/[0.04] dark:ring-white/10" />
            <div className="h-3 w-3 rounded-[3px] bg-rose-500/85" />
            <div className="h-3 w-3 rounded-[3px] bg-orange-500/80" />
            <div className="h-3 w-3 rounded-[3px] bg-amber-400/85" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-400/80" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-500" />
          </div>
          <span className="text-[10.5px] font-medium text-slate-500">More</span>
          <span className="ml-2 text-[10.5px] text-slate-400">
            {summary.classDays} class days · current streak {summary.currentStreak}d
          </span>
        </div>
      </div>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl text-white shadow-2xl sm:max-w-xl">
          {selectedDay && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-white">
                  {format(selectedDay.date, 'EEEE, dd MMMM yyyy')}
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  {selectedDay.hasClass
                    ? `${selectedDay.presentCount} of ${selectedDay.totalCount} classes attended · ${Math.round(selectedDay.percentage)}%`
                    : 'No attendance records for this day.'}
                </DialogDescription>
              </DialogHeader>
              {selectedDay.hasClass ? (
                <div className="space-y-2">
                  {selectedDay.records.map((record, index) => (
                    <div
                      key={record.lectureId || `${record.subjectCode}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-white">{record.subjectName}</p>
                        {record.lectureNumber ? (
                          <p className="mt-1 text-xs text-slate-400">Lecture {record.lectureNumber}</p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          record.status === 'present'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-slate-300">
                  There are no scheduled attendance records to show for this date.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
