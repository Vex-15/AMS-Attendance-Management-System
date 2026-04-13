// Intelligence and analytics services for MITAOE
import { getDB } from './db';

export interface AttendanceStats {
  totalLectures: number;
  totalPresent: number;
  totalAbsent: number;
  percentage: number;
  status: 'safe' | 'warning' | 'at-risk';
  statusLabel: string;
  statusColor: string;
}

export interface ClassesNeededResult {
  classesNeeded: number;
  message: string;
  currentPercentage: number;
  targetPercentage: number;
}

export interface PredictionResult {
  estimatedPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  trendMessage: string;
  riskStatus: 'safe' | 'warning' | 'at-risk';
}

export interface SimulationResult {
  currentPercentage: number;
  ifMissNext: number;
  predictedPercentage: number;
  willReachTarget: boolean;
}

export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  stats: AttendanceStats;
  lastLectureDate: Date | null;
  lectureCount: number;
}

// ============= HELPER: Get teacher name for a subject =============
export function getTeacherNameForSubject(subjectId: string): string {
  const db = getDB();
  const subject = db.subjects.get(subjectId);
  if (!subject) return 'Unknown';
  const teacher = db.teachers.get(subject.teacherId);
  if (!teacher) return 'Unknown';
  const user = db.users.get(teacher.userId);
  return user?.name || 'Unknown';
}

// ============= HELPER: Get subject display name with division =============
export function getSubjectDisplayName(subjectId: string): string {
  const db = getDB();
  const subject = db.subjects.get(subjectId);
  if (!subject) return 'Unknown';
  const yearLabels: Record<number, string> = { 1: 'FY', 2: 'SY', 3: 'TY', 4: 'BE' };
  return `${subject.name} — ${yearLabels[subject.year] || 'Y' + subject.year} ${subject.division}`;
}

// ============= ATTENDANCE CALCULATIONS =============

export function getAttendanceStats(
  studentId: string,
  subjectId?: string
): AttendanceStats {
  const db = getDB();
  
  let attendanceRecords = Array.from(db.attendance.values()).filter(
    (a) => a.studentId === studentId
  );

  if (subjectId) {
    const lecturesInSubject = Array.from(db.lectures.values())
      .filter((l) => l.subjectId === subjectId)
      .map((l) => l.id);
    
    attendanceRecords = attendanceRecords.filter((a) =>
      lecturesInSubject.includes(a.lectureId)
    );
  }

  const totalLectures = attendanceRecords.length;
  const totalPresent = attendanceRecords.filter((a) => a.status === 'present').length;
  const totalAbsent = totalLectures - totalPresent;

  const percentage = totalLectures > 0 ? (totalPresent / totalLectures) * 100 : 0;
  
  let status: 'safe' | 'warning' | 'at-risk';
  let statusLabel: string;
  let statusColor: string;

  if (percentage < 75) {
    status = 'at-risk';
    statusLabel = 'At Risk';
    statusColor = 'red';
  } else if (percentage < 85) {
    status = 'warning';
    statusLabel = 'Warning';
    statusColor = 'yellow';
  } else {
    status = 'safe';
    statusLabel = 'Safe';
    statusColor = 'green';
  }

  return {
    totalLectures,
    totalPresent,
    totalAbsent,
    percentage: Math.round(percentage * 100) / 100,
    status,
    statusLabel,
    statusColor,
  };
}

// ============= CLASSES NEEDED CALCULATOR =============

export function calculateClassesNeeded(
  studentId: string,
  subjectId: string,
  targetPercentage: number = 75
): ClassesNeededResult {
  const stats = getAttendanceStats(studentId, subjectId);
  const { totalPresent, totalLectures } = stats;
  const currentPercentage = stats.percentage;

  if (currentPercentage >= targetPercentage) {
    return {
      classesNeeded: 0,
      message: `You are already at ${currentPercentage}% attendance!`,
      currentPercentage,
      targetPercentage,
    };
  }

  const classesNeeded = Math.ceil(
    ((targetPercentage / 100) * totalLectures - totalPresent) /
      (1 - targetPercentage / 100)
  );

  return {
    classesNeeded: Math.max(0, classesNeeded),
    message: `You need ${Math.max(0, classesNeeded)} more classes to reach ${targetPercentage}%`,
    currentPercentage,
    targetPercentage,
  };
}

// ============= TREND ANALYSIS =============

export function analyzeTrend(
  studentId: string,
  subjectId: string,
  lookbackPeriod: number = 5
): PredictionResult {
  const db = getDB();

  const subjectLectures = Array.from(db.lectures.values())
    .filter((l) => l.subjectId === subjectId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (subjectLectures.length < 10) {
    const stats = getAttendanceStats(studentId, subjectId);
    return {
      estimatedPercentage: stats.percentage,
      trend: 'stable',
      trendMessage: 'Insufficient data for trend analysis',
      riskStatus: stats.status,
    };
  }

  const recentLectures = subjectLectures.slice(0, lookbackPeriod);
  const previousLectures = subjectLectures.slice(lookbackPeriod, lookbackPeriod * 2);

  const recentAttendance = Array.from(db.attendance.values()).filter(
    (a) =>
      a.studentId === studentId &&
      recentLectures.some((l) => l.id === a.lectureId)
  );

  const previousAttendance = Array.from(db.attendance.values()).filter(
    (a) =>
      a.studentId === studentId &&
      previousLectures.some((l) => l.id === a.lectureId)
  );

  const recentRate =
    recentLectures.length > 0
      ? recentAttendance.filter((a) => a.status === 'present').length /
        recentLectures.length
      : 0;

  const previousRate =
    previousLectures.length > 0
      ? previousAttendance.filter((a) => a.status === 'present').length /
        previousLectures.length
      : recentRate;

  let trend: 'improving' | 'declining' | 'stable';
  let trendMessage: string;

  if (recentRate > previousRate + 0.05) {
    trend = 'improving';
    trendMessage = `Improving (${Math.round(recentRate * 100)}% vs ${Math.round(previousRate * 100)}%)`;
  } else if (recentRate < previousRate - 0.05) {
    trend = 'declining';
    trendMessage = `Declining (${Math.round(recentRate * 100)}% vs ${Math.round(previousRate * 100)}%)`;
  } else {
    trend = 'stable';
    trendMessage = `Stable at ${Math.round(recentRate * 100)}%`;
  }

  const stats = getAttendanceStats(studentId, subjectId);
  let estimatedPercentage = stats.percentage;

  if (trend === 'improving') {
    estimatedPercentage = Math.min(100, estimatedPercentage + 5);
  } else if (trend === 'declining') {
    estimatedPercentage = Math.max(0, estimatedPercentage - 5);
  }

  let riskStatus: 'safe' | 'warning' | 'at-risk';
  if (estimatedPercentage < 75) {
    riskStatus = 'at-risk';
  } else if (estimatedPercentage < 85) {
    riskStatus = 'warning';
  } else {
    riskStatus = 'safe';
  }

  return {
    estimatedPercentage: Math.round(estimatedPercentage * 100) / 100,
    trend,
    trendMessage,
    riskStatus,
  };
}

// ============= SIMULATION TOOL =============

export function simulateMissingClasses(
  studentId: string,
  subjectId: string,
  classesToMiss: number
): SimulationResult {
  const stats = getAttendanceStats(studentId, subjectId);
  const currentPercentage = stats.percentage;
  const { totalPresent, totalLectures } = stats;

  const newTotal = totalLectures + classesToMiss;
  const predictedPercentage =
    newTotal > 0 ? (totalPresent / newTotal) * 100 : currentPercentage;

  const willReachTarget = predictedPercentage >= 75;

  return {
    currentPercentage,
    ifMissNext: classesToMiss,
    predictedPercentage: Math.round(predictedPercentage * 100) / 100,
    willReachTarget,
  };
}

// ============= SUBJECT ANALYTICS =============

export function getSubjectAnalytics(studentId: string): SubjectAnalytics[] {
  const db = getDB();

  const enrollments = Array.from(db.enrollments.values()).filter(
    (e) => e.studentId === studentId
  );

  return enrollments
    .map((enrollment) => {
      const subject = db.subjects.get(enrollment.subjectId)!;
      const stats = getAttendanceStats(studentId, enrollment.subjectId);
      const teacherName = getTeacherNameForSubject(enrollment.subjectId);

      const subjectLectures = Array.from(db.lectures.values())
        .filter((l) => l.subjectId === enrollment.subjectId)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        subjectId: enrollment.subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        teacherName,
        stats,
        lastLectureDate: subjectLectures[0]?.date || null,
        lectureCount: subjectLectures.length,
      };
    })
    .sort((a, b) => a.stats.percentage - b.stats.percentage);
}

// ============= TEACHER ANALYTICS =============

export function getClassAnalytics(subjectId: string) {
  const db = getDB();

  const lectures = Array.from(db.lectures.values())
    .filter((l) => l.subjectId === subjectId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const subject = db.subjects.get(subjectId)!;

  const enrollments = Array.from(db.enrollments.values()).filter(
    (e) => e.subjectId === subjectId
  );

  const studentStats = enrollments.map((enrollment) => {
    const student = db.students.get(enrollment.studentId)!;
    const user = db.users.get(student.userId)!;
    const stats = getAttendanceStats(enrollment.studentId, subjectId);

    return {
      studentId: enrollment.studentId,
      studentName: user.name,
      rollNumber: `${subject.code.substring(0, 2)}${String(enrollments.indexOf(enrollment) + 1).padStart(3, '0')}`,
      division: student.division,
      stats,
    };
  });

  const classAverage =
    studentStats.length > 0
      ? studentStats.reduce((sum, s) => sum + s.stats.percentage, 0) /
        studentStats.length
      : 0;

  const lowestPerformers = studentStats
    .sort((a, b) => a.stats.percentage - b.stats.percentage);

  // Daily attendance summary for last 10 lectures
  const recentLectures = lectures.slice(0, 10).reverse();
  const dailyAttendance = recentLectures.map((lecture) => {
    const attendanceForLecture = Array.from(db.attendance.values()).filter(
      (a) => a.lectureId === lecture.id && a.status === 'present'
    );

    return {
      lectureNumber: lecture.lectureNumber,
      date: lecture.date,
      presentCount: attendanceForLecture.length,
      totalCount: enrollments.length,
      percentage: enrollments.length > 0 ? Math.round(
        (attendanceForLecture.length / enrollments.length) * 100
      ) : 0,
    };
  });

  // Year label
  const yearLabels: Record<number, string> = { 1: 'FY', 2: 'SY', 3: 'TY', 4: 'BE' };

  return {
    subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    subjectDisplayName: `${subject.name} — ${yearLabels[subject.year] || 'Y' + subject.year} ${subject.division}`,
    division: subject.division,
    year: subject.year,
    totalStudents: enrollments.length,
    classAverage: Math.round(classAverage * 100) / 100,
    lowestPerformers,
    dailyAttendance,
    recentLectures: recentLectures.length,
  };
}

// ============= SEARCH & FILTER =============

export function searchStudents(query: string) {
  const db = getDB();
  const lowerQuery = query.toLowerCase();

  const students = Array.from(db.students.values())
    .map((student) => {
      const user = db.users.get(student.userId)!;
      return { ...student, user };
    })
    .filter(
      (s) =>
        s.user.name.toLowerCase().includes(lowerQuery) ||
        s.user.email.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 20);

  return students;
}

export function filterAttendanceByStatus(
  studentId: string,
  status: 'at-risk' | 'warning' | 'safe' | 'all'
) {
  const db = getDB();

  if (status === 'all') {
    return getSubjectAnalytics(studentId);
  }

  const analytics = getSubjectAnalytics(studentId);
  return analytics.filter((a) => a.stats.status === status);
}
