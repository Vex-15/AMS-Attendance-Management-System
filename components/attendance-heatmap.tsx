'use client';

import { useMemo, useState } from 'react';
import { format, subWeeks, startOfWeek, addDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
}

export default function AttendanceHeatmap({ attendanceHistory }: AttendanceHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const weeksCount = 12;
    const startDate = startOfWeek(subWeeks(today, weeksCount - 1), { weekStartsOn: 1 });

    // Flatten all records into a date map
    const dateMap = new Map<string, { records: AttendanceRecord[] }>();

    Object.values(attendanceHistory).forEach((records) => {
      records.forEach((record) => {
        const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { records: [] });
        }
        const entry = dateMap.get(dateKey)!;
        entry.records.push(record);
      });
    });

    // Build weeks grid
    const weeks: HeatmapDay[][] = [];

    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = '';

    for (let w = 0; w < weeksCount; w++) {
      const week: HeatmapDay[] = [];
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

        const hasClass = !!entry && entry.records.length > 0;
        const records = entry?.records || [];
        const presentCount = records.filter((record) => record.status === 'present').length;
        const absentCount = records.length - presentCount;
        const totalCount = records.length;
        const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : -1;

        week.push({
          date,
          dateKey,
          percentage,
          presentCount,
          absentCount,
          totalCount,
          records,
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
        <div className="flex gap-[3px] pl-9 sm:gap-1 lg:gap-[5px]">
          {(() => {
            const cells: React.ReactNode[] = [];
            let labelIdx = 0;
            for (let w = 0; w < 12; w++) {
              const ml = monthLabels.find(m => m.colIndex === w);
              cells.push(
                <div key={w} className="w-4 text-center sm:w-5 lg:w-6">
                  <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
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
          <div className="mr-2 flex shrink-0 flex-col gap-[3px] sm:gap-1 lg:gap-[5px]">
            {dayLabels.map((day, i) => (
              <div key={i} className="flex h-4 items-center justify-end pr-1 sm:h-5 lg:h-6">
                <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">{day}</span>
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[3px] sm:gap-1 lg:gap-[5px]">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px] sm:gap-1 lg:gap-[5px]">
                {week.map((day) => (
                  <Tooltip key={day.dateKey}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        aria-label={day.hasClass
                          ? `${format(day.date, 'EEEE, dd MMM yyyy')}: ${day.presentCount} of ${day.totalCount} classes attended, ${Math.round(day.percentage)}%`
                          : `${format(day.date, 'EEEE, dd MMM yyyy')}: no classes scheduled`}
                        className={`block h-4 w-4 appearance-none rounded-[4px] border-0 p-0 transition-[transform,box-shadow] duration-150 hover:z-10 hover:scale-110 hover:ring-2 hover:ring-white/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${getCellColor(day.percentage, day.hasClass)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      collisionPadding={12}
                      className="z-[100] w-72 max-w-[calc(100vw-2rem)] whitespace-normal break-words rounded-lg border border-white/15 bg-slate-950 px-3 py-2.5 text-left text-slate-100 shadow-2xl"
                    >
                      <p className="text-sm font-semibold leading-snug text-white">{format(day.date, 'EEEE, dd MMM yyyy')}</p>
                      {!day.hasClass ? (
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">No classes scheduled</p>
                      ) : (
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-xs leading-relaxed text-slate-200">
                            {day.presentCount} of {day.totalCount} classes attended ({Math.round(day.percentage)}%)
                          </p>
                          {day.records.map((record, i) => (
                            <p key={record.lectureId || `${record.subjectCode}-${i}`} className={`break-words text-xs leading-relaxed ${record.status === 'present' ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {record.status === 'present' ? 'Present' : 'Absent'} · {record.subjectCode} · Lecture {record.lectureNumber}
                            </p>
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
        <div className="flex items-center gap-2 pt-1 pl-9">
          <span className="text-[11px] font-medium text-slate-400">Lower</span>
          <div className="flex gap-1" aria-hidden="true">
            <div className="h-3 w-3 rounded-[3px] bg-white/[0.06] ring-1 ring-white/10" />
            <div className="h-3 w-3 rounded-[3px] bg-red-500/75" />
            <div className="h-3 w-3 rounded-[3px] bg-orange-500/75" />
            <div className="h-3 w-3 rounded-[3px] bg-yellow-500/75" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-500/75" />
            <div className="h-3 w-3 rounded-[3px] bg-emerald-400" />
          </div>
          <span className="text-[11px] font-medium text-slate-400">Higher attendance</span>
        </div>
      </div>
      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="glass-card max-h-[85vh] overflow-y-auto border-white/10 bg-slate-950 text-white sm:max-w-xl">
          {selectedDay && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-white">{format(selectedDay.date, 'EEEE, dd MMMM yyyy')}</DialogTitle>
                <DialogDescription className="text-slate-300">
                  {selectedDay.hasClass
                    ? `${selectedDay.presentCount} of ${selectedDay.totalCount} classes attended · ${Math.round(selectedDay.percentage)}% attendance`
                    : 'No attendance records for this day.'}
                </DialogDescription>
              </DialogHeader>
              {selectedDay.hasClass ? (
                <div className="space-y-2">
                  {selectedDay.records.map((record, index) => (
                    <div key={record.lectureId || `${record.subjectCode}-${index}`} className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-white">{record.subjectName}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {record.subjectCode}{record.lectureNumber ? ` · Lecture ${record.lectureNumber}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${record.status === 'present' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
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
