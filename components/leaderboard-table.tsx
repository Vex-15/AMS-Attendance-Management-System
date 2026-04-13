'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  division: string;
  overallPercentage: number;
  status: 'safe' | 'warning' | 'at-risk';
  statusLabel: string;
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  classAverage: number;
  currentStudentId?: string;
  showBottomSection?: boolean;
}

export default function LeaderboardTable({ leaderboard, classAverage, currentStudentId, showBottomSection = true }: LeaderboardTableProps) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getStatusBadge = (status: string, label: string) => {
    const styles: Record<string, string> = {
      'safe': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
      'warning': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
      'at-risk': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
    };
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${styles[status] || ''}`}>
        {label}
      </span>
    );
  };

  const topStudents = leaderboard.slice(0, Math.min(leaderboard.length, 20));
  const bottomStudents = showBottomSection ? leaderboard.slice(-5).filter(s => s.status === 'at-risk').reverse() : [];

  return (
    <div className="space-y-6">
      {/* Class Average Line */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Class Average</span>
        <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{classAverage}%</span>
      </div>

      {/* Main Leaderboard */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Division</TableHead>
              <TableHead className="text-right">Attendance %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topStudents.map((student, idx) => (
              <TableRow
                key={student.studentId}
                className={`${
                  student.studentId === currentStudentId
                    ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-500'
                    : idx % 2 === 0
                    ? 'bg-white dark:bg-background'
                    : 'bg-gray-50 dark:bg-muted/30'
                } transition-colors`}
              >
                <TableCell className="font-medium text-lg">
                  {getRankDisplay(student.rank)}
                </TableCell>
                <TableCell className="font-medium">
                  {student.name}
                  {student.studentId === currentStudentId && (
                    <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{student.division}</TableCell>
                <TableCell className="text-right font-semibold text-lg">
                  {student.overallPercentage.toFixed(1)}%
                </TableCell>
                <TableCell>{getStatusBadge(student.status, student.statusLabel)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Needs Attention Section */}
      {bottomStudents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            ⚠️ Needs Attention
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottomStudents.map((student) => (
                  <TableRow key={student.studentId} className="bg-red-50/50 dark:bg-red-950/30">
                    <TableCell className="font-medium">#{student.rank}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.division}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {student.overallPercentage.toFixed(1)}%
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status, student.statusLabel)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
