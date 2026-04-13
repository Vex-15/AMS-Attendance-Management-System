'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import StudentNav from '@/components/student-nav';

interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  stats: {
    totalLectures: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number;
    status: 'safe' | 'warning' | 'at-risk';
    statusLabel: string;
    statusColor: string;
  };
  classesNeeded: {
    classesNeeded: number;
    message: string;
    currentPercentage: number;
    targetPercentage: number;
  };
  trend: {
    estimatedPercentage: number;
    trend: 'improving' | 'declining' | 'stable';
    trendMessage: string;
    riskStatus: 'safe' | 'warning' | 'at-risk';
  };
  lastLectureDate: string | null;
  lectureCount: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [analytics, setAnalytics] = useState<SubjectAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectAnalytics | null>(null);
  const [simulateValue, setSimulateValue] = useState(3);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
        const response = await fetch(`/api/student/analytics?studentId=${roleData.id}`);

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const data = await response.json();
        setAnalytics(data.analytics);
        if (data.analytics.length > 0) {
          setSelectedSubject(data.analytics[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, router]);

  const handleSimulation = async () => {
    if (!selectedSubject) return;

    try {
      const roleData = JSON.parse(localStorage.getItem('mitaoe_roleData') || '{}');
      const response = await fetch('/api/student/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: roleData.id,
          subjectId: selectedSubject.subjectId,
          classesToMiss: simulateValue,
        }),
      });

      if (!response.ok) throw new Error('Simulation failed');
      const result = await response.json();
      setSimulationResult(result);
    } catch (err) {
      console.error('[v0] Simulation error:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'at-risk':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'improving' ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : trend === 'declining' ? (
      <TrendingDown className="w-4 h-4 text-red-500" />
    ) : null;
  };

  // Prepare chart data
  const chartData = analytics.map((s) => ({
    name: s.subjectCode,
    attendance: Math.round(s.stats.percentage),
    target: 75,
  }));

  const atRiskCount = analytics.filter((s) => s.stats.status === 'at-risk').length;
  const safeCount = analytics.filter((s) => s.stats.status === 'safe').length;
  const avgAttendance = Math.round(
    analytics.reduce((sum, s) => sum + s.stats.percentage, 0) / analytics.length
  );

  return (
    <div className="min-h-screen bg-background">
      <StudentNav userName={user?.name || 'Student'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Academic Dashboard</h1>
          <p className="text-muted-foreground">Track your attendance and academic performance</p>
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
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgAttendance}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all subjects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Safe Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{safeCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">of {analytics.length} subjects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{atRiskCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Below 75%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Lectures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics.reduce((sum, s) => sum + s.lectureCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Across all subjects</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Attendance Overview</CardTitle>
                <CardDescription>Your attendance percentage in each subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                    <Legend />
                    <Bar dataKey="attendance" fill="var(--primary)" name="Your Attendance" />
                    <Bar dataKey="target" fill="var(--muted)" name="Target (75%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Details</CardTitle>
                <CardDescription>Detailed analytics and intelligence for each subject</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="0" className="space-y-4">
                  <TabsList className="grid w-full gap-1" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))` }}>
                    {analytics.map((subject, idx) => (
                      <TabsTrigger key={idx} value={String(idx)} className="text-xs">
                        {subject.subjectCode}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {analytics.map((subject, idx) => (
                    <TabsContent key={idx} value={String(idx)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Attendance Stats */}
                        <Card className="border-border">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                              {getStatusIcon(subject.stats.status)}
                            </div>
                            <CardDescription>{subject.subjectCode}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Attendance</span>
                                <span className="text-2xl font-bold">{subject.stats.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    subject.stats.status === 'safe'
                                      ? 'bg-green-500'
                                      : subject.stats.status === 'warning'
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, subject.stats.percentage)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Present</p>
                                <p className="font-semibold">{subject.stats.totalPresent}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Absent</p>
                                <p className="font-semibold">{subject.stats.totalAbsent}</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border">
                              <p className="text-sm">
                                <Badge className={
                                  subject.stats.status === 'safe'
                                    ? 'bg-green-600'
                                    : subject.stats.status === 'warning'
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                                }>
                                  {subject.stats.statusLabel}
                                </Badge>
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Classes Needed & Trend */}
                        <div className="space-y-4">
                          {/* Classes Needed */}
                          <Card className="border-border">
                            <CardHeader>
                              <CardTitle className="text-base">Classes Needed to Reach 75%</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {subject.classesNeeded.classesNeeded === 0 ? (
                                <div className="text-center py-2">
                                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                  <p className="text-sm font-medium">You have reached your target!</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-3xl font-bold text-primary">
                                    {subject.classesNeeded.classesNeeded}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">more classes required</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Trend Analysis */}
                          <Card className="border-border">
                            <CardHeader>
                              <CardTitle className="text-base">Trend Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2">
                                {getTrendIcon(subject.trend.trend)}
                                <span className="text-sm font-medium capitalize">{subject.trend.trend}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{subject.trend.trendMessage}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Estimated future: {subject.trend.estimatedPercentage}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Simulation Tool */}
                      <Card className="border-border bg-secondary/30">
                        <CardHeader>
                          <CardTitle className="text-base">What-If Simulator</CardTitle>
                          <CardDescription>See how missing classes affects your attendance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Classes to miss: {simulateValue}</label>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={simulateValue}
                              onChange={(e) => setSimulateValue(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          <Button onClick={handleSimulation} className="w-full">
                            Simulate
                          </Button>

                          {simulationResult && (
                            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-sm">
                              <p>
                                <span className="font-medium">Current:</span> {simulationResult.currentPercentage.toFixed(1)}%
                              </p>
                              <p>
                                <span className="font-medium">After missing {simulationResult.ifMissNext}:</span>{' '}
                                {simulationResult.predictedPercentage.toFixed(1)}%
                              </p>
                              <p>
                                <span className="font-medium">Will reach 75%:</span>{' '}
                                <Badge className={simulationResult.willReachTarget ? 'bg-green-600' : 'bg-red-600'}>
                                  {simulationResult.willReachTarget ? 'Yes' : 'No'}
                                </Badge>
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
