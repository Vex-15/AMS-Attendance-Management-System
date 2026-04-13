'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, AlertCircle } from 'lucide-react';
import StudentNav from '@/components/student-nav';

interface SearchResult {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  branch: string;
  year: number;
  division: string;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<SearchResult | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, router]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search/students?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('[v0] Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStudent = async (student: SearchResult) => {
    setSelectedStudent(student);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/student/analytics?studentId=${student.id}`);
      if (response.ok) {
        const data = await response.json();
        setStudentAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('[v0] Analytics fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for status distribution chart
  const statusDistribution = selectedStudent && studentAnalytics
    ? [
        {
          name: 'Safe (>85%)',
          value: studentAnalytics.filter((s: any) => s.stats.status === 'safe').length,
        },
        {
          name: 'Warning (75-85%)',
          value: studentAnalytics.filter((s: any) => s.stats.status === 'warning').length,
        },
        {
          name: 'At Risk (<75%)',
          value: studentAnalytics.filter((s: any) => s.stats.status === 'at-risk').length,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <StudentNav userName={user?.name || 'User'} onLogout={logout} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Search & Analytics</h1>
          <p className="text-muted-foreground">Search for students and view their detailed analytics</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Students</CardTitle>
            <CardDescription>Find any student by name or email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectStudent(result)}
                    className={`w-full text-left p-3 hover:bg-secondary border-b last:border-b-0 transition ${
                      selectedStudent?.id === result.id ? 'bg-secondary' : ''
                    }`}
                  >
                    <p className="font-semibold text-sm">{result.user.name}</p>
                    <p className="text-xs text-muted-foreground">{result.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.branch} - Year {result.year} Div {result.division}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No students found matching your search.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Student Analytics */}
        {selectedStudent && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <div>
                  <CardTitle>{selectedStudent.user.name}</CardTitle>
                  <CardDescription>{selectedStudent.user.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-semibold">{selectedStudent.branch}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-semibold">{selectedStudent.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Division</p>
                    <p className="font-semibold">{selectedStudent.division}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Subjects</p>
                    <p className="font-semibold">{studentAnalytics?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
              </Card>
            ) : studentAnalytics && studentAnalytics.length > 0 ? (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Status Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statusDistribution.some((d) => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-64 flex items-center justify-center text-muted-foreground">
                            No data available
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Summary Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {studentAnalytics && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Average Attendance</p>
                              <p className="text-3xl font-bold">
                                {(
                                  studentAnalytics.reduce((sum: number, s: any) => sum + s.stats.percentage, 0) /
                                  studentAnalytics.length
                                ).toFixed(1)}
                                %
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Subjects at Risk</p>
                              <p className="text-3xl font-bold text-red-600">
                                {studentAnalytics.filter((s: any) => s.stats.status === 'at-risk').length}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Subjects Safe</p>
                              <p className="text-3xl font-bold text-green-600">
                                {studentAnalytics.filter((s: any) => s.stats.status === 'safe').length}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Subject-wise Attendance Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead className="text-right">Attendance %</TableHead>
                              <TableHead className="text-right">Present</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Trend</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentAnalytics.map((subject: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold text-sm">{subject.subjectName}</p>
                                    <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {subject.stats.percentage.toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">{subject.stats.totalPresent}</TableCell>
                                <TableCell className="text-right">{subject.stats.totalLectures}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      subject.stats.status === 'safe'
                                        ? 'bg-green-600'
                                        : subject.stats.status === 'warning'
                                        ? 'bg-yellow-600'
                                        : 'bg-red-600'
                                    }
                                  >
                                    {subject.stats.statusLabel}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {subject.trend.trend}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No analytics data available for this student.</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </main>
    </div>
  );
}
