'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { AlertCircle, CheckCircle2, XCircle, Users, RotateCcw, Copy, Send, BarChart3, UserCheck, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import TeacherNav from '@/components/teacher-nav';
import ExportButton from '@/components/export-button';
import { format } from 'date-fns';

interface StudentStats {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  division?: string;
  stats: {
    totalLectures: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'at-risk';
    statusLabel: string;
  };
}

interface DailyAttendance {
  lectureNumber: number;
  date: string;
  presentCount: number;
  totalCount: number;
  percentage: number;
}

interface ClassAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectDisplayName: string;
  division: string;
  year: number;
  totalStudents: number;
  classAverage: number;
  lowestPerformers: StudentStats[];
  dailyAttendance: DailyAttendance[];
}

interface LectureInfo { id: string; subjectId: string; date: string; lectureNumber: number; }
interface StudentAttendance { studentId: string; studentName: string; rollNumber: string; division: string; status: 'present' | 'absent' | null; }

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [subjects, setSubjects] = useState<ClassAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('analytics');
  const [lectures, setLectures] = useState<LectureInfo[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [isLoadingLectures, setIsLoadingLectures] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');

  const selectedSubject = subjects[selectedSubjectIdx] || null;

  useEffect(() => {
    if (!isAuthenticated) { router.push('/'); return; }
    const fetchAnalytics = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        const response = await fetch(`/api/teacher/class-analytics?teacherId=${roleData.id}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        const subjectsList = Array.isArray(data.subjects) ? data.subjects : [data];
        setSubjects(subjectsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!selectedSubject) return;
    setIsLoadingLectures(true);
    fetch(`/api/teacher/lectures?subjectId=${selectedSubject.subjectId}`)
      .then(r => r.json())
      .then(data => { setLectures(data.lectures || []); setSelectedLectureId(''); setStudentAttendance([]); })
      .catch(() => toast.error('Failed to load lectures'))
      .finally(() => setIsLoadingLectures(false));
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedLectureId) return;
    setIsLoadingStudents(true);
    fetch(`/api/teacher/lecture-attendance?lectureId=${selectedLectureId}`)
      .then(r => r.json())
      .then(data => setStudentAttendance(data.students || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setIsLoadingStudents(false));
  }, [selectedLectureId]);

  const toggleStatus = (sid: string) => {
    setStudentAttendance(prev => prev.map(s => s.studentId === sid ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s));
  };
  const markAll = (status: 'present' | 'absent') => setStudentAttendance(prev => prev.map(s => ({ ...s, status })));
  const resetAll = () => setStudentAttendance(prev => prev.map(s => ({ ...s, status: null })));

  const copyPreviousLecture = async () => {
    const currentIdx = lectures.findIndex(l => l.id === selectedLectureId);
    if (currentIdx <= 0) { toast.info('No previous lecture'); return; }
    try {
      const res = await fetch(`/api/teacher/lecture-attendance?lectureId=${lectures[currentIdx - 1].id}`);
      const data = await res.json();
      const prevMap = new Map((data.students || []).map((s: StudentAttendance) => [s.studentId, s.status]));
      setStudentAttendance(prev => prev.map(s => ({ ...s, status: (prevMap.get(s.studentId) as any) || s.status })));
      toast.success('Copied from previous lecture');
    } catch { toast.error('Failed to copy'); }
  };

  const submitAttendance = async () => {
    const unmarked = studentAttendance.filter(s => s.status === null);
    if (unmarked.length > 0) { toast.warning(`${unmarked.length} students unmarked`); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/teacher/mark-attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: selectedLectureId, attendanceData: studentAttendance.map(s => ({ studentId: s.studentId, status: s.status })) }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      toast.success(`Saved for ${result.markedCount} students`);
    } catch { toast.error('Failed to submit'); }
    finally { setIsSubmitting(false); }
  };

  const getFilteredStudents = (students: StudentStats[]) => {
    if (filterRisk === 'all') return students;
    return students.filter(s => s.stats.status === filterRisk);
  };

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card rounded-lg px-3 py-2 text-xs">
          <p className="text-white font-medium">Lecture #{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}%</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav userName={user?.name || 'Teacher'} onLogout={logout} />
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="glass-card rounded-xl p-6"><Skeleton className="h-8 w-20 bg-white/5" /></div>)}</div>
          <div className="glass-card rounded-xl p-6"><Skeleton className="h-[300px] w-full bg-white/5" /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav userName={user?.name || 'Teacher'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-violet-400" /> Class Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor and manage attendance</p>
          </div>
          {selectedSubject && (
            <ExportButton subjectCode={selectedSubject.subjectCode} subjectName={selectedSubject.subjectName} subjectId={selectedSubject.subjectId} />
          )}
        </div>

        {error && <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Subject Selector (shows "SubjectName — Year Division") */}
        <div className="mb-6">
          <Select value={String(selectedSubjectIdx)} onValueChange={(v) => setSelectedSubjectIdx(Number(v))}>
            <SelectTrigger className="glass-input text-white border-white/10 w-full md:w-[400px] h-10">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {subjects.map((subject, idx) => (
                <SelectItem key={idx} value={String(idx)} className="text-white hover:bg-white/10">
                  {subject.subjectDisplayName || `${subject.subjectName} — ${subject.division}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSubject && (
          <>
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'analytics' ? 'gradient-btn text-white' : 'glass-card text-slate-400 hover:text-white'}`}>
                <BarChart3 className="w-3.5 h-3.5" /> Analytics
              </button>
              <button onClick={() => setActiveTab('mark')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'mark' ? 'gradient-btn text-white' : 'glass-card text-slate-400 hover:text-white'}`}>
                <UserCheck className="w-3.5 h-3.5" /> Mark Attendance
              </button>
            </div>

            {activeTab === 'analytics' ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                  <div className="glass-card-hover rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-blue-400" /><span className="text-xs text-slate-400">Class Average</span></div>
                    <p className="text-3xl font-bold text-white">{selectedSubject.classAverage}%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="progress-gradient h-full" style={{ width: `${selectedSubject.classAverage}%` }} /></div>
                  </div>
                  <div className="glass-card-hover rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-cyan-400" /><span className="text-xs text-slate-400">Enrolled</span></div>
                    <p className="text-3xl font-bold text-white">{selectedSubject.totalStudents}</p>
                    <p className="text-xs text-slate-500 mt-1">students</p>
                  </div>
                  <div className="glass-card-hover rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-slate-400">At Risk</span></div>
                    <p className="text-3xl font-bold text-red-400">{selectedSubject.lowestPerformers.filter(s => s.stats.status === 'at-risk').length}</p>
                    <p className="text-xs text-slate-500 mt-1">below 75%</p>
                  </div>
                </div>

                {/* Daily Trend Chart */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Daily Attendance Trend (Last 10 Lectures)</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={selectedSubject.dailyAttendance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="lectureNumber" stroke="#64748b" tick={{ fontSize: 11 }}>
                        <Label value="Lecture #" position="insideBottom" offset={-5} style={{ fill: '#64748b', fontSize: 11 }} />
                      </XAxis>
                      <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }}>
                        <Label value="Students Present (%)" angle={-90} position="insideLeft" style={{ fill: '#64748b', fontSize: 11 }} />
                      </YAxis>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="percentage" stroke="#60a5fa" strokeWidth={2} name="Attendance %" dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Student Table */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h3 className="text-sm font-semibold text-white">Student Performance</h3>
                    <Select value={filterRisk} onValueChange={setFilterRisk}>
                      <SelectTrigger className="glass-input text-white border-white/10 w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="at-risk">At Risk</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="safe">Safe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full table-premium">
                      <thead>
                        <tr>
                          <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Student</th>
                          <th className="text-right text-xs font-medium text-slate-400 py-3 px-4">Attendance %</th>
                          <th className="text-right text-xs font-medium text-slate-400 py-3 px-4">Present / Total</th>
                          <th className="text-xs font-medium text-slate-400 py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredStudents(selectedSubject.lowestPerformers).map((student, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 text-sm text-white font-medium">{student.studentName}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-bold text-white">{student.stats.percentage.toFixed(1)}%</span>
                              <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden w-20 ml-auto">
                                <div className="progress-gradient h-full" style={{ width: `${student.stats.percentage}%` }} />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-slate-400">{student.stats.totalPresent}/{student.stats.totalLectures}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                student.stats.status === 'safe' ? 'status-safe' :
                                student.stats.status === 'warning' ? 'status-warning' : 'status-danger pulse-danger'
                              }`}>
                                {student.stats.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* MARK ATTENDANCE */
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-violet-400" />
                    {selectedSubject.subjectDisplayName || selectedSubject.subjectName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Select a lecture and mark attendance</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Select Lecture</label>
                  {isLoadingLectures ? <Skeleton className="h-10 w-full bg-white/5" /> : (
                    <Select value={selectedLectureId} onValueChange={setSelectedLectureId}>
                      <SelectTrigger className="glass-input text-white border-white/10 w-full"><SelectValue placeholder="Choose a lecture..." /></SelectTrigger>
                      <SelectContent className="glass-card border-white/10 max-h-64">
                        {lectures.map(l => (
                          <SelectItem key={l.id} value={l.id} className="text-white hover:bg-white/10">
                            Lecture #{l.lectureNumber} — {format(new Date(l.date), 'dd MMM yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedLectureId && (
                  <>
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <button onClick={() => markAll('present')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Present
                      </button>
                      <button onClick={() => markAll('absent')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition">
                        <XCircle className="w-3.5 h-3.5" /> All Absent
                      </button>
                      <button onClick={copyPreviousLecture} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition">
                        <Copy className="w-3.5 h-3.5" /> Copy Previous
                      </button>
                      <button onClick={resetAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-white/5 hover:bg-white/10 transition">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                    </div>

                    {isLoadingStudents ? (
                      <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto border border-white/5 rounded-lg">
                          <table className="w-full table-premium">
                            <thead>
                              <tr>
                                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4 w-8">#</th>
                                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Student</th>
                                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Roll No</th>
                                <th className="text-left text-xs font-medium text-slate-400 py-3 px-4">Div</th>
                                <th className="text-center text-xs font-medium text-slate-400 py-3 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentAttendance.map((student, idx) => (
                                <tr key={student.studentId} className="cursor-pointer" onClick={() => toggleStatus(student.studentId)}>
                                  <td className="py-3 px-4 text-xs text-slate-500">{idx + 1}</td>
                                  <td className="py-3 px-4 text-sm text-white font-medium">{student.studentName}</td>
                                  <td className="py-3 px-4 text-xs text-slate-400">{student.rollNumber}</td>
                                  <td className="py-3 px-4 text-xs text-slate-400">{student.division}</td>
                                  <td className="py-3 px-4 text-center">
                                    {student.status === null ? (
                                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/5 text-slate-500">Unset</span>
                                    ) : student.status === 'present' ? (
                                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full status-safe">✓ Present</span>
                                    ) : (
                                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full status-danger">✗ Absent</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="text-xs text-slate-400 flex gap-3">
                            <span className="text-emerald-400">{studentAttendance.filter(s => s.status === 'present').length} Present</span>
                            <span className="text-red-400">{studentAttendance.filter(s => s.status === 'absent').length} Absent</span>
                            <span className="text-slate-500">{studentAttendance.filter(s => s.status === null).length} Unset</span>
                          </div>
                          <button onClick={submitAttendance} disabled={isSubmitting} className="gradient-btn text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                            <Send className="w-3.5 h-3.5" />
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
