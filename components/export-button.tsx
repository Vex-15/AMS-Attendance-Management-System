'use client';

import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  subjectCode: string;
  subjectName: string;
  subjectId: string;
}

export default function ExportButton({ subjectCode, subjectName, subjectId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const lecturesRes = await fetch(`/api/teacher/lectures?subjectId=${subjectId}`);
      if (!lecturesRes.ok) throw new Error('Failed');
      const lecturesData = await lecturesRes.json();
      const lectures = lecturesData.lectures || [];

      const attendanceMatrix: Record<string, Record<string, string>> = {};
      const studentInfo: Record<string, { name: string; rollNo: string }> = {};

      for (const lecture of lectures) {
        const attRes = await fetch(`/api/teacher/lecture-attendance?lectureId=${lecture.id}`);
        if (!attRes.ok) continue;
        const attData = await attRes.json();

        for (const student of attData.students) {
          if (!attendanceMatrix[student.studentId]) {
            attendanceMatrix[student.studentId] = {};
            studentInfo[student.studentId] = { name: student.studentName, rollNo: student.rollNumber };
          }
          attendanceMatrix[student.studentId][lecture.id] = student.status === 'present' ? 'P' : 'A';
        }
      }

      const dateHeaders = lectures.map((l: any) => {
        const date = new Date(l.date);
        return `L${l.lectureNumber} (${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`;
      });

      const rows: string[] = [];
      rows.push(['Student Name', 'Roll No', ...dateHeaders, 'Present', 'Total', '%'].join(','));

      Object.entries(attendanceMatrix).forEach(([studentId, statuses]) => {
        const info = studentInfo[studentId];
        const vals = lectures.map((l: any) => statuses[l.id] || '-');
        const present = Object.values(statuses).filter(s => s === 'P').length;
        const pct = lectures.length > 0 ? ((present / lectures.length) * 100).toFixed(1) + '%' : '0%';
        rows.push([`"${info.name}"`, info.rollNo, ...vals, present, lectures.length, pct].join(','));
      });

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${subjectCode}_attendance.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`CSV exported for ${subjectName}`);
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="btn-soft px-3.5 py-2 text-xs font-semibold disabled:opacity-60"
    >
      {isExporting ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {isExporting ? 'Preparing…' : 'Export CSV'}
    </button>
  );
}
