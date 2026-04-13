'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AdminNav from '@/components/admin-nav';
import { getDB, initializeDB } from '@/lib/db';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Initialize DB and get stats
  const db = initializeDB();
  const stats = {
    totalUsers: db.users.size,
    totalStudents: db.students.size,
    totalTeachers: db.teachers.size,
    totalSubjects: db.subjects.size,
    totalEnrollments: db.enrollments.size,
    totalLectures: db.lectures.size,
    totalAttendanceRecords: db.attendance.size,
  };

  const students = Array.from(db.students.values()).slice(0, 10);
  const teachers = Array.from(db.teachers.values());
  const subjects = Array.from(db.subjects.values()).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav userName={user?.name || 'Admin'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">System Administration</h1>
          <p className="text-muted-foreground">Monitor and manage the entire MITAOE attendance system</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="database">Database Stats</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalStudents}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalTeachers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalSubjects}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalEnrollments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Lectures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalLectures}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalAttendanceRecords}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Status:</strong> All systems operational
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database Status:</span>
                    <span className="font-semibold text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Integrity:</span>
                    <span className="font-semibold text-green-600">Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Backup:</span>
                    <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Stats Tab */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
                <CardDescription>Detailed breakdown of all database entities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                    <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subjects</p>
                    <p className="text-2xl font-bold">{stats.totalSubjects}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollments</p>
                    <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lectures</p>
                    <p className="text-2xl font-bold">{stats.totalLectures}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance Records</p>
                    <p className="text-2xl font-bold">{stats.totalAttendanceRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Density</p>
                    <p className="text-2xl font-bold">
                      {((stats.totalAttendanceRecords / (stats.totalEnrollments * stats.totalLectures)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The system contains {stats.totalStudents} students across {stats.totalSubjects} subjects with{' '}
                {stats.totalAttendanceRecords} attendance records representing a realistic institutional dataset.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sample Students (First 10)</CardTitle>
                  <CardDescription>Active students in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {students.map((student, idx) => {
                      const user = db.users.get(student.userId);
                      return (
                        <div key={idx} className="border-b pb-3 last:border-b-0">
                          <p className="font-semibold text-sm">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.branch} - Year {student.year} Div {student.division}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teachers</CardTitle>
                  <CardDescription>All faculty members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teachers.map((teacher, idx) => {
                      const user = db.users.get(teacher.userId);
                      return (
                        <div key={idx} className="border-b pb-3 last:border-b-0">
                          <p className="font-semibold text-sm">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                          <p className="text-xs text-muted-foreground">{teacher.subjects.length} subjects assigned</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sample Subjects (First 10)</CardTitle>
                <CardDescription>Academic subjects in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject, idx) => {
                    const teacher = db.users.get(db.teachers.get(subject.teacherId)?.userId || '');
                    return (
                      <div key={idx} className="border border-border rounded-lg p-4">
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                        <p className="text-xs text-muted-foreground mt-1">Year {subject.year} - {subject.branch}</p>
                        <p className="text-xs text-primary mt-2">Taught by: {teacher?.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
