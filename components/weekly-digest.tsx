'use client';

import { useMemo } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { CalendarDays } from 'lucide-react';
import { Meter } from '@/components/ui-kit';

interface WeeklyDigestProps {
  attendanceHistory: Record<string, Array<{ date: string; status: 'present' | 'absent' }>>;
}

export default function WeeklyDigest({ attendanceHistory }: WeeklyDigestProps) {
  const { weekData, totalAttended, totalScheduled } = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyCounts = dayNames.map((name) => ({ name, present: 0, total: 0 }));
    let totalAttended = 0;
    let totalScheduled = 0;

    Object.values(attendanceHistory).forEach((records) => {
      records.forEach((record) => {
        const recordDate = new Date(record.date);
        if (isWithinInterval(recordDate, { start: weekStart, end: weekEnd })) {
          const dayOfWeek = recordDate.getDay();
          const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          dailyCounts[idx].total++;
          totalScheduled++;
          if (record.status === 'present') {
            dailyCounts[idx].present++;
            totalAttended++;
          }
        }
      });
    });

    return { weekData: dailyCounts, totalAttended, totalScheduled };
  }, [attendanceHistory]);

  const pct = totalScheduled > 0 ? Math.round((totalAttended / totalScheduled) * 100) : 0;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
            This week
          </h3>
          <p className="mt-1 text-[10.5px] text-slate-500">
            <span className="tnum">{totalAttended}</span> of{' '}
            <span className="tnum">{totalScheduled}</span> classes attended
          </p>
        </div>
        <span
          className={`tnum rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            pct >= 85
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
              : pct >= 75
                ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
          }`}
        >
          {pct}%
        </span>
      </div>

      <Meter
        value={pct}
        variant={pct >= 85 ? 'safe' : pct >= 75 ? 'warning' : 'danger'}
        className="mt-3.5"
      />

      <div className="-mx-1 mt-2">
        <ResponsiveContainer width="100%" height={92}>
          <BarChart data={weekData} barCategoryGap="32%">
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: 'rgba(11,15,26,0.96)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '11px',
                color: '#e2e8f0',
                boxShadow: '0 20px 40px -20px rgba(0,0,0,0.9)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
            />
            <Bar dataKey="present" radius={[4, 4, 0, 0]} name="Present">
              {weekData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.total === 0
                      ? 'rgba(255,255,255,0.05)'
                      : entry.present === entry.total
                        ? '#4ade80'
                        : entry.present > 0
                          ? '#818cf8'
                          : '#fb7185'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
