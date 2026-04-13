'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';
import StudentNav from '@/components/student-nav';
import { format } from 'date-fns';

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
  trend: { trend: 'improving' | 'declining' | 'stable'; trendMessage: string; };
}

export default function StudentReportPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [analytics, setAnalytics] = useState<SubjectAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') { router.push('/'); return; }
    const fetchData = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        setStudentInfo(roleData);
        const response = await fetch(`/api/student/analytics?studentId=${roleData.id}`);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setAnalytics(data.analytics || []);
      } catch (err) { console.error('Report error:', err); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [isAuthenticated, user, router]);

  const avgAttendance = analytics.length > 0
    ? Math.round((analytics.reduce((sum, s) => sum + s.stats.percentage, 0) / analytics.length) * 100) / 100 : 0;
  const overallStatus = avgAttendance >= 85 ? 'Safe' : avgAttendance >= 75 ? 'Warning' : 'At Risk';
  const atRiskSubjects = analytics.filter(s => s.stats.status === 'at-risk');

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <StudentNav userName={user?.name || 'Student'} onLogout={logout} />
      </div>

      <main className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 print:text-black">
              <FileText className="w-6 h-6 text-blue-400 print:hidden" />
              Attendance Report
            </h1>
            <p className="text-xs text-slate-400 mt-1 print:text-gray-600">
              Generated on {format(new Date(), 'dd MMMM yyyy, hh:mm a')}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="gradient-btn text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full bg-white/5" />)}</div>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {/* Student Info */}
            <div className="glass-card rounded-xl p-5 print:bg-white print:border print:border-gray-300 print:shadow-none">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Student Name', value: user?.name },
                  { label: 'Branch', value: studentInfo?.branch || 'N/A' },
                  { label: 'Year', value: `Year ${studentInfo?.year || 'N/A'}` },
                  { label: 'Division', value: studentInfo?.division || 'N/A' },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium print:text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5 print:text-black">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card rounded-xl p-5 print:bg-white print:border print:border-gray-300 print:shadow-none">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 print:text-gray-500">Overall Summary</h2>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-white print:text-black">{avgAttendance}%</p>
                  <p className="text-[10px] text-slate-500 mt-1 print:text-gray-500">Overall Average</p>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    overallStatus === 'Safe' ? 'status-safe' : overallStatus === 'Warning' ? 'status-warning' : 'status-danger'
                  } print:border print:border-current`}>
                    {overallStatus}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-2 print:text-gray-500">Status</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white print:text-black">{analytics.length}</p>
                  <p className="text-[10px] text-slate-500 mt-1 print:text-gray-500">Subjects</p>
                </div>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="glass-card rounded-xl p-5 print:bg-white print:border print:border-gray-300 print:shadow-none">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 print:text-gray-500">Subject-wise Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full table-premium">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">Subject</th>
                      <th className="text-right text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">Lectures</th>
                      <th className="text-right text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">Present</th>
                      <th className="text-right text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">Absent</th>
                      <th className="text-right text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">%</th>
                      <th className="text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">Status</th>
                      <th className="text-[10px] font-medium text-slate-400 py-3 px-3 print:text-gray-600">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((subject, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3">
                          <p className="text-sm font-medium text-white print:text-black">{subject.subjectName}</p>
                          <p className="text-[10px] text-slate-500 print:text-gray-500">{subject.subjectCode} · {subject.teacherName}</p>
                        </td>
                        <td className="py-3 px-3 text-right text-xs text-slate-300 print:text-gray-700">{subject.stats.totalLectures}</td>
                        <td className="py-3 px-3 text-right text-xs text-emerald-400 print:text-green-700">{subject.stats.totalPresent}</td>
                        <td className="py-3 px-3 text-right text-xs text-red-400 print:text-red-700">{subject.stats.totalAbsent}</td>
                        <td className="py-3 px-3 text-right text-sm font-bold text-white print:text-black">{subject.stats.percentage.toFixed(1)}%</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            subject.stats.status === 'safe' ? 'status-safe' :
                            subject.stats.status === 'warning' ? 'status-warning' : 'status-danger'
                          }`}>
                            {subject.stats.statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-400 capitalize print:text-gray-600">{subject.trend.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Summary */}
            {atRiskSubjects.length > 0 && (
              <div className="rounded-xl p-5 bg-red-500/10 border border-red-500/20 print:bg-red-50 print:border-red-300">
                <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 print:text-red-700">
                  <AlertTriangle className="w-4 h-4" /> Subjects Needing Attention
                </h2>
                <ul className="space-y-1.5">
                  {atRiskSubjects.map((s) => (
                    <li key={s.subjectId} className="text-xs text-red-300 print:text-red-700">
                      <strong>{s.subjectName}</strong> — {s.stats.percentage.toFixed(1)}%
                      {s.classesNeeded.classesNeeded > 0 && ` (need ${s.classesNeeded.classesNeeded} more for 75%)`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-600 pt-4 border-t border-white/5 print:border-gray-300 print:text-gray-500">
              <p>MITAOE Smart Attendance & Academic Intelligence System</p>
              <p className="mt-0.5">Auto-generated report. For discrepancies, contact your department coordinator.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
