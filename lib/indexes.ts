// Derived lookup indexes over the in-memory store.
//
// The dataset is large enough (hundreds of students x 5 subjects x 30 lectures)
// that scanning every attendance row per calculation is wasteful. These maps are
// built once per database revision and reused until the next mutation.
import { getDB, type Attendance, type Enrollment, type Lecture } from './db';

export interface DbIndexes {
  revision: number;
  /** studentId -> attendance rows */
  attendanceByStudent: Map<string, Attendance[]>;
  /** lectureId -> attendance rows */
  attendanceByLecture: Map<string, Attendance[]>;
  /** subjectId -> lectures, oldest first */
  lecturesBySubject: Map<string, Lecture[]>;
  /** lectureId -> subjectId */
  lectureSubject: Map<string, string>;
  /** studentId -> enrollments */
  enrollmentsByStudent: Map<string, Enrollment[]>;
  /** subjectId -> enrollments */
  enrollmentsBySubject: Map<string, Enrollment[]>;
  /** subjectId -> set of lecture ids */
  lectureIdsBySubject: Map<string, Set<string>>;
}

let cached: DbIndexes | null = null;

function pushTo<T>(map: Map<string, T[]>, key: string, value: T): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

function buildIndexes(revision: number): DbIndexes {
  const db = getDB();

  const attendanceByStudent = new Map<string, Attendance[]>();
  const attendanceByLecture = new Map<string, Attendance[]>();
  for (const record of db.attendance.values()) {
    pushTo(attendanceByStudent, record.studentId, record);
    pushTo(attendanceByLecture, record.lectureId, record);
  }

  const lecturesBySubject = new Map<string, Lecture[]>();
  const lectureSubject = new Map<string, string>();
  const lectureIdsBySubject = new Map<string, Set<string>>();
  for (const lecture of db.lectures.values()) {
    pushTo(lecturesBySubject, lecture.subjectId, lecture);
    lectureSubject.set(lecture.id, lecture.subjectId);
    const ids = lectureIdsBySubject.get(lecture.subjectId);
    if (ids) ids.add(lecture.id);
    else lectureIdsBySubject.set(lecture.subjectId, new Set([lecture.id]));
  }
  for (const lectures of lecturesBySubject.values()) {
    lectures.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const enrollmentsByStudent = new Map<string, Enrollment[]>();
  const enrollmentsBySubject = new Map<string, Enrollment[]>();
  for (const enrollment of db.enrollments.values()) {
    pushTo(enrollmentsByStudent, enrollment.studentId, enrollment);
    pushTo(enrollmentsBySubject, enrollment.subjectId, enrollment);
  }

  return {
    revision,
    attendanceByStudent,
    attendanceByLecture,
    lecturesBySubject,
    lectureSubject,
    enrollmentsByStudent,
    enrollmentsBySubject,
    lectureIdsBySubject,
  };
}

export function getIndexes(): DbIndexes {
  const db = getDB();
  if (cached && cached.revision === db.revision) return cached;
  cached = buildIndexes(db.revision);
  return cached;
}
