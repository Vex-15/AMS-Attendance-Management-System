'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import StudentNav from '@/components/student-nav';
import Reveal from '@/components/reveal';
import { Meter, Panel, StatusPill } from '@/components/ui-kit';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  stats: {
    totalLectures: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'at-risk';
    statusLabel: string;
  };
  classesNeeded: { classesNeeded: number };
  trend: { trend: 'improving' | 'declining' | 'stable'; trendMessage: string };
}

export default function StudentReportPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [analytics, setAnalytics] = useState<SubjectAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [generatedAt, setGeneratedAt] = useState('');

  useEffect(() => {
    setGeneratedAt(format(new Date(), 'dd MMMM yyyy, hh:mm a'));
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || user?.role !== 'student') {
      router.push('/');
      return;
    }
    const fetchData = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        setStudentInfo(roleData);
        const response = await fetch(`/api/student/analytics?studentId=${roleData.id}`);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setAnalytics(data.analytics || []);
      } catch (err) {
        console.error('Report error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthLoading, isAuthenticated, user, router]);

  const avgAttendance =
    analytics.length > 0
      ? Math.round((analytics.reduce((sum, s) => sum + s.stats.percentage, 0) / analytics.length) * 100) /
        100
      : 0;
  const overallStatus: 'safe' | 'warning' | 'at-risk' =
    avgAttendance >= 85 ? 'safe' : avgAttendance >= 75 ? 'warning' : 'at-risk';
  const overallLabel = avgAttendance >= 85 ? 'Safe' : avgAttendance >= 75 ? 'Warning' : 'At Risk';
  const atRiskSubjects = analytics.filter((s) => s.stats.status === 'at-risk');
  const totalLectures = analytics.reduce((sum, s) => sum + s.stats.totalLectures, 0);
  const totalPresent = analytics.reduce((sum, s) => sum + s.stats.totalPresent, 0);

  const downloadCsv = () => {
    if (analytics.length === 0) return;

    const rows: (string | number)[][] = [
      ['Student', 'Branch', 'Year', 'Division'],
      [
        user?.name || '',
        studentInfo?.branch || '',
        studentInfo?.year ? `Year ${studentInfo.year}` : '',
        studentInfo?.division || '',
      ],
      [],
      ['Subject', 'Code', 'Teacher', 'Lectures', 'Present', 'Absent', 'Percentage', 'Status'],
      ...analytics.map((subject) => [
        subject.subjectName,
        subject.subjectCode,
        subject.teacherName,
        subject.stats.totalLectures,
        subject.stats.totalPresent,
        subject.stats.totalAbsent,
        subject.stats.percentage.toFixed(1),
        subject.stats.statusLabel,
      ]),
      [],
      ['Overall average', '', '', '', '', '', `${avgAttendance}%`, overallLabel],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance report downloaded');
  };

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <StudentNav userName={user?.name || 'Student'} onLogout={logout} />
      </div>

      <main id="content" tabIndex={-1} className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-6 focus:outline-none">
        <header className="animate-slide-up mb-6 flex flex-wrap items-end justify-between gap-4 print:mb-4">
          <div>
            <p className="eyebrow flex items-center gap-1.5 print:hidden">
              <Sparkles className="h-3 w-3 text-indigo-300" />
              Official record
            </p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-white print:text-black">
              Attendance report
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 print:text-gray-600">
              {generatedAt ? `Generated ${generatedAt}` : 'Generated on request'}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={downloadCsv}
              disabled={isLoading || analytics.length === 0}
              className="btn-soft inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              className="gradient-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
            >
              <Printer className="h-4 w-4" />
              Print / PDF
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl skeleton-sheen" />
            ))}
          </div>
        ) : (
          <Reveal>
            <Panel className="overflow-hidden print:border print:border-gray-300 print:shadow-none">
              {/* Document header band */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/[0.1] via-transparent to-cyan-500/[0.06] px-6 py-5 print:bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/25 print:shadow-none">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-white print:text-black">
                      MITAOE
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 print:text-gray-500">
                      Academic intelligence
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-400 print:text-gray-600">
                    <FileText className="h-3 w-3" />
                    Attendance statement
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-600 print:text-gray-500">
                    {generatedAt ? generatedAt.split(',')[0] : '—'}
                  </p>
                </div>
              </div>

              <div className="p-6">
                {/* Student identity */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                  {[
                    { label: 'Student name', value: user?.name },
                    { label: 'Branch', value: studentInfo?.branch || '—' },
                    { label: 'Year', value: studentInfo?.year ? `Year ${studentInfo.year}` : '—' },
                    { label: 'Division', value: studentInfo?.division || '—' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 print:text-gray-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-white print:text-black">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="surface-quiet rounded-xl p-4 print:border print:border-gray-200">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 print:text-gray-500">
                      Overall average
                    </p>
                    <p className="tnum mt-2 text-[30px] font-semibold leading-none text-white print:text-black">
                      {avgAttendance}
                      <span className="text-sm text-slate-500">%</span>
                    </p>
                    <Meter
                      value={avgAttendance}
                      variant={overallStatus === 'safe' ? 'safe' : overallStatus === 'warning' ? 'warning' : 'danger'}
                      className="mt-3 print:hidden"
                    />
                  </div>
                  <div className="surface-quiet rounded-xl p-4 print:border print:border-gray-200">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 print:text-gray-500">
                      Status
                    </p>
                    <div className="mt-3">
                      <StatusPill status={overallStatus} label={overallLabel} />
                    </div>
                    <p className="mt-3 text-[10.5px] text-slate-500 print:text-gray-500">
                      {totalPresent} of {totalLectures} lectures attended
                    </p>
                  </div>
                  <div className="surface-quiet rounded-xl p-4 print:border print:border-gray-200">
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 print:text-gray-500">
                      Subjects
                    </p>
                    <p className="tnum mt-2 text-[30px] font-semibold leading-none text-white print:text-black">
                      {analytics.length}
                    </p>
                    <p className="mt-3 text-[10.5px] text-slate-500 print:text-gray-500">
                      {atRiskSubjects.length} needing attention
                    </p>
                  </div>
                </div>

                {/* Subject table */}
                <div className="mt-7">
                  <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 print:text-gray-500">
                    Subject-wise breakdown
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.06] print:border-gray-200">
                    <table className="table-premium w-full min-w-[560px]">
                      <thead>
                        <tr>
                          {['Subject', 'Lectures', 'Present', 'Absent', '%', 'Status'].map(
                            (heading, i) => (
                              <th
                                key={heading}
                                className={`px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-slate-500 print:text-gray-600 ${
                                  i === 0 ? 'text-left' : i === 5 ? 'text-center' : 'text-right'
                                }`}
                              >
                                {heading}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.map((subject) => (
                          <tr key={subject.subjectId}>
                            <td className="px-4 py-3">
                              <p className="text-xs font-medium text-white print:text-black">
                                {subject.subjectName}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500 print:text-gray-500">
                                {subject.subjectCode} · {subject.teacherName}
                              </p>
                            </td>
                            <td className="tnum px-4 py-3 text-right text-[11px] text-slate-300 print:text-gray-700">
                              {subject.stats.totalLectures}
                            </td>
                            <td className="tnum px-4 py-3 text-right text-[11px] text-emerald-300 print:text-green-700">
                              {subject.stats.totalPresent}
                            </td>
                            <td className="tnum px-4 py-3 text-right text-[11px] text-rose-300 print:text-red-700">
                              {subject.stats.totalAbsent}
                            </td>
                            <td className="tnum px-4 py-3 text-right text-xs font-semibold text-white print:text-black">
                              {subject.stats.percentage.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusPill status={subject.stats.status} label={subject.stats.statusLabel} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Attention callout */}
                {atRiskSubjects.length > 0 && (
                  <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-4 print:border-red-300 print:bg-red-50">
                    <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300 print:text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Subjects needing attention
                    </h2>
                    <ul className="mt-2.5 space-y-1.5">
                      {atRiskSubjects.map((s) => (
                        <li
                          key={s.subjectId}
                          className="text-[11px] leading-relaxed text-rose-200/80 print:text-red-800"
                        >
                          <span className="font-semibold text-rose-100 print:text-red-900">
                            {s.subjectName}
                          </span>{' '}
                          — {s.stats.percentage.toFixed(1)}%
                          {s.classesNeeded.classesNeeded > 0 &&
                            ` · ${s.classesNeeded.classesNeeded} more classes needed for 75%`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {atRiskSubjects.length === 0 && (
                  <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 print:border-green-300 print:bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300 print:text-green-700" />
                    <p className="text-[11px] text-emerald-200/80 print:text-green-800">
                      All subjects are above the 75% attendance threshold. Keep it up.
                    </p>
                  </div>
                )}

                <div className="mt-6 border-t border-white/[0.06] pt-4 text-center print:border-gray-300">
                  <p className="text-[10px] text-slate-600 print:text-gray-500">
                    MITAOE Smart Attendance &amp; Academic Intelligence System
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-600 print:text-gray-500">
                    Auto-generated statement. For discrepancies, contact your department
                    coordinator.
                  </p>
                </div>
              </div>
            </Panel>
          </Reveal>
        )}
      </main>
    </div>
  );
}
