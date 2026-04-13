'use client';

import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { CalendarDays } from 'lucide-react';

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
          if (record.status === 'present') { dailyCounts[idx].present++; totalAttended++; }
        }
      });
    });

    return { weekData: dailyCounts, totalAttended, totalScheduled };
  }, [attendanceHistory]);

  const pct = totalScheduled > 0 ? Math.round((totalAttended / totalScheduled) * 100) : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-cyan-400" /> This Week
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        {totalAttended}/{totalScheduled} classes · {pct}% rate
      </p>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={weekData} barCategoryGap="25%">
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="present" radius={[3, 3, 0, 0]} name="Present">
            {weekData.map((entry, i) => (
              <Cell key={i} fill={entry.present === entry.total && entry.total > 0 ? '#22c55e' : entry.present > 0 ? '#60a5fa' : '#1e293b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
