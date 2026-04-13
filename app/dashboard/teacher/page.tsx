'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingDown } from 'lucide-react';
import TeacherNav from '@/components/teacher-nav';

interface StudentStats {
  studentId: string;
  studentName: string;
  stats: {
    totalLectures: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'at-risk';
    statusLabel: string;
    statusColor: string;
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
  totalStudents: number;
  classAverage: number;
  lowestPerformers: StudentStats[];
  dailyAttendance: DailyAttendance[];
  recentLectures: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [subjects, setSubjects] = useState<ClassAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<ClassAnalytics | null>(null);
  const [markingMode, setMarkingMode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        const response = await fetch(`/api/teacher/class-analytics?teacherId=${roleData.id}`);

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const data = await response.json();
        const subjectsList = Array.isArray(data.subjects) ? data.subjects : [data];
        setSubjects(subjectsList);
        if (subjectsList.length > 0) {
          setSelectedSubject(subjectsList[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, router]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'at-risk':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return '';
    }
  };

  if (!selectedSubject && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TeacherNav userName={user?.name || 'Teacher'} onLogout={logout} />
        <main className="p-8 max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No subjects assigned to this teacher.</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav userName={user?.name || 'Teacher'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Class Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your class attendance</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="0" className="space-y-6">
            <TabsList className="grid w-full gap-1" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` }}>
              {subjects.map((subject, idx) => (
                <TabsTrigger
                  key={idx}
                  value={String(idx)}
                  onClick={() => setSelectedSubject(subject)}
                  className="text-xs"
                >
                  {subject.subjectCode}
                </TabsTrigger>
              ))}
            </TabsList>

            {subjects.map((subject, idx) => (
              <TabsContent key={idx} value={String(idx)} className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{subject.classAverage}%</div>
                      <p className="text-xs text-muted-foreground mt-1">Attendance</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{subject.totalStudents}</div>
                      <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {subject.lowestPerformers.filter((s) => s.stats.status === 'at-risk').length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Below 75%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Class Attendance (Last 10 Lectures)</CardTitle>
                    <CardDescription>Attendance percentage for recent lectures</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={subject.dailyAttendance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="lectureNumber" stroke="var(--muted-foreground)" />
                        <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          stroke="var(--primary)"
                          name="Attendance %"
                          dot={{ fill: 'var(--primary)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Lowest Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Students Needing Attention</CardTitle>
                    <CardDescription>Top 5 lowest performing students in this subject</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="text-right">Attendance %</TableHead>
                            <TableHead className="text-right">Present / Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subject.lowestPerformers.map((student, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{student.studentName}</TableCell>
                              <TableCell className="text-right text-lg font-semibold">
                                {student.stats.percentage.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {student.stats.totalPresent} / {student.stats.totalLectures}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                                    student.stats.status
                                  )}`}
                                >
                                  {student.stats.statusLabel}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>{subject.subjectName}</CardTitle>
                    <CardDescription>{subject.subjectCode}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subject Code</p>
                        <p className="font-semibold text-lg">{subject.subjectCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recent Lectures Conducted</p>
                        <p className="font-semibold text-lg">{subject.recentLectures}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> Use the attendance marking system to record student attendance for new lectures.
                        The system automatically calculates all analytics and predictions based on historical data.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
}
