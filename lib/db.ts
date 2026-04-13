// In-memory database for MITAOE attendance system (no fs dependencies)

// ============= DATABASE TYPES =============
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In production, use bcrypt
  role: 'student' | 'teacher' | 'admin';
  createdAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  branch: string; // CSE, DS, AI-ML
  year: number; // 1-4 (FE, SE, TE, BE)
  division: string; // A, B, C
}

export interface Teacher {
  id: string;
  userId: string;
  department: string;
  subjects: string[]; // subject IDs
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  branch: string;
  year: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  subjectId: string;
  enrolledAt: Date;
}

export interface Lecture {
  id: string;
  subjectId: string;
  date: Date;
  lectureNumber: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  lectureId: string;
  status: 'present' | 'absent'; // present, absent
  markedAt: Date;
}

// ============= DATABASE STORE =============
export interface Database {
  users: Map<string, User>;
  students: Map<string, Student>;
  teachers: Map<string, Teacher>;
  subjects: Map<string, Subject>;
  enrollments: Map<string, Enrollment>;
  lectures: Map<string, Lecture>;
  attendance: Map<string, Attendance>;
}

let db: Database | null = null;

// ============= INITIALIZATION =============
export function initializeDB(): Database {
  if (db) return db;

  db = {
    users: new Map(),
    students: new Map(),
    teachers: new Map(),
    subjects: new Map(),
    enrollments: new Map(),
    lectures: new Map(),
    attendance: new Map(),
  };

  // Initialize with seed data
  if (db.users.size === 0) {
    seedDatabase(db);
  }

  return db;
}

export function getDB(): Database {
  if (!db) {
    return initializeDB();
  }
  return db;
}

// ============= SEED DATA GENERATION =============
function seedDatabase(database: Database): void {
  const indianFirstNames = [
    'Aarav', 'Aditya', 'Arjun', 'Akshay', 'Anmol', 'Ashish', 'Aryan', 'Ankur',
    'Riya', 'Rihana', 'Radha', 'Rupali', 'Rhea', 'Rina', 'Ritika', 'Ruhani',
    'Priya', 'Pooja', 'Pallavi', 'Payal', 'Puja', 'Purnima', 'Preeti', 'Pragati',
    'Neha', 'Nisha', 'Nikita', 'Nandini', 'Navya', 'Noor', 'Naina', 'Namita',
    'Sneha', 'Smriti', 'Sharanya', 'Sana', 'Shweta', 'Sakshi', 'Swati', 'Supriya',
    'Kunal', 'Karan', 'Keshav', 'Kavya', 'Karan', 'Khushi', 'Kris', 'Kriti',
    'Raj', 'Rahul', 'Rohan', 'Rishabh', 'Rohit', 'Raghav', 'Ranveer', 'Rajesh',
    'Ananya', 'Anjali', 'Amira', 'Avni', 'Aria', 'Anika', 'Anushka', 'Aparna',
    'Siddharth', 'Samir', 'Sandeep', 'Sanjay', 'Sameer', 'Sidharth', 'Suresh', 'Sumit',
    'Varun', 'Vihaan', 'Vikram', 'Vishal', 'Vivek', 'Vikas', 'Vicky', 'Vaibhav',
    'Manish', 'Manoj', 'Mahesh', 'Madhav', 'Mani', 'Mayank', 'Mrigank', 'Manoj',
    'Deepak', 'Dhaval', 'Dhruv', 'Devesh', 'Dilip', 'Dinesh', 'Darsh', 'Dev',
    'Harshita', 'Harini', 'Heena', 'Hina', 'Helly', 'Harsh', 'Harsha', 'Hansika',
  ];

  const lastNames = [
    'Sharma', 'Patel', 'Kulkarni', 'Iyer', 'Verma', 'Nair', 'Shah', 'Deshpande',
    'Jain', 'Gupta', 'Singh', 'Kumar', 'Rao', 'Reddy', 'Pillai', 'Menon',
    'Desai', 'Yadav', 'Pandey', 'Trivedi', 'Khanna', 'Bhat', 'Hegde', 'Bhatnagar',
  ];

  const branches = ['Computer Engineering', 'Data Science', 'AI & ML'];
  const departments = ['Engineering', 'Computer Science', 'Data Science'];
  const divisions = ['A', 'B', 'C'];

  const subjects_list = [
    { name: 'Database Management Systems', code: 'CS201', branch: 'Computer Engineering', year: 2 },
    { name: 'Operating Systems', code: 'CS202', branch: 'Computer Engineering', year: 2 },
    { name: 'Computer Networks', code: 'CS203', branch: 'Computer Engineering', year: 2 },
    { name: 'Data Structures & Algorithms', code: 'CS101', branch: 'Computer Engineering', year: 1 },
    { name: 'Artificial Intelligence', code: 'CS301', branch: 'AI & ML', year: 3 },
    { name: 'Machine Learning', code: 'DS301', branch: 'Data Science', year: 3 },
    { name: 'Mathematics III', code: 'M201', branch: 'Computer Engineering', year: 2 },
    { name: 'Software Engineering', code: 'CS202E', branch: 'Computer Engineering', year: 2 },
    { name: 'Compiler Design', code: 'CS302', branch: 'Computer Engineering', year: 3 },
    { name: 'Distributed Systems', code: 'CS303', branch: 'Computer Engineering', year: 3 },
    { name: 'Web Development', code: 'CS104', branch: 'Computer Engineering', year: 1 },
    { name: 'Cloud Computing', code: 'CS304', branch: 'Data Science', year: 3 },
  ];

  // Create admin user
  const adminUserId = 'user-admin-1';
  database.users.set(adminUserId, {
    id: adminUserId,
    name: 'Admin User',
    email: 'admin@mitaoe.edu.in',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date(),
  });

  // Create teachers
  const teacherNames = [
    { name: 'Prof. Deshmukh', email: 'deshmukh@mitaoe.edu.in' },
    { name: 'Prof. Iyer', email: 'iyer@mitaoe.edu.in' },
    { name: 'Prof. Kulkarni', email: 'kulkarni@mitaoe.edu.in' },
    { name: 'Prof. Shah', email: 'shah@mitaoe.edu.in' },
    { name: 'Prof. Nair', email: 'nair@mitaoe.edu.in' },
    { name: 'Prof. Singh', email: 'singh@mitaoe.edu.in' },
    { name: 'Prof. Verma', email: 'verma@mitaoe.edu.in' },
    { name: 'Prof. Rao', email: 'rao@mitaoe.edu.in' },
    { name: 'Prof. Patel', email: 'patel@mitaoe.edu.in' },
    { name: 'Prof. Reddy', email: 'reddy@mitaoe.edu.in' },
    { name: 'Prof. Mehta', email: 'mehta@mitaoe.edu.in' },
    { name: 'Prof. Joshi', email: 'joshi@mitaoe.edu.in' },
    { name: 'Prof. Bhat', email: 'bhat@mitaoe.edu.in' },
    { name: 'Prof. Hegde', email: 'hegde@mitaoe.edu.in' },
    { name: 'Prof. Menon', email: 'menon@mitaoe.edu.in' },
  ];

  const teachers = teacherNames.map((t, i) => {
    const userId = `user-teacher-${i}`;
    database.users.set(userId, {
      id: userId,
      name: t.name,
      email: t.email,
      password: 'teacher123',
      role: 'teacher',
      createdAt: new Date(),
    });

    const teacherId = `teacher-${i}`;
    const teacher: Teacher = {
      id: teacherId,
      userId,
      department: departments[i % departments.length],
      subjects: [],
    };
    database.teachers.set(teacherId, teacher);
    return { id: teacherId, userId, ...t };
  });

  // Create subjects
  const subjectMap = new Map<string, { id: string; teacherId: string }>();
  subjects_list.forEach((s, idx) => {
    const subjectId = `subject-${idx}`;
    const teacherId = teachers[idx % teachers.length].id;

    database.subjects.set(subjectId, {
      id: subjectId,
      name: s.name,
      code: s.code,
      teacherId,
      branch: s.branch,
      year: s.year,
    });

    subjectMap.set(subjectId, { id: subjectId, teacherId });

    const teacher = database.teachers.get(teacherId)!;
    teacher.subjects.push(subjectId);
  });

  // Create students (100+ total)
  let studentIndex = 0;
  const students: Array<{ id: string; userId: string; email: string; name: string }> = [];

  for (const branch of branches) {
    for (const year of [1, 2, 3, 4]) {
      for (const division of divisions) {
        for (let j = 0; j < 8; j++) {
          const firstName = indianFirstNames[studentIndex % indianFirstNames.length];
          const lastName = lastNames[(studentIndex + j) % lastNames.length];
          const name = `${firstName} ${lastName}`;
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentIndex}@mitaoe.edu.in`;

          const userId = `user-student-${studentIndex}`;
          database.users.set(userId, {
            id: userId,
            name,
            email,
            password: 'student123',
            role: 'student',
            createdAt: new Date(),
          });

          const studentId = `student-${studentIndex}`;
          database.students.set(studentId, {
            id: studentId,
            userId,
            branch,
            year,
            division,
          });

          students.push({ id: studentId, userId, email, name });
          studentIndex++;
        }
      }
    }
  }

  // Create enrollments
  students.forEach((student) => {
    const studentData = database.students.get(student.id)!;
    
    subjects_list.forEach((subject, idx) => {
      if (subject.branch === studentData.branch && subject.year === studentData.year) {
        const enrollmentId = `enrollment-${student.id}-${idx}`;
        database.enrollments.set(enrollmentId, {
          id: enrollmentId,
          studentId: student.id,
          subjectId: `subject-${idx}`,
          enrolledAt: new Date(),
        });
      }
    });
  });

  // Create lectures
  const today = new Date();
  let lectureIdCounter = 0;

  Array.from(database.subjects.values()).forEach((subject) => {
    for (let i = 0; i < 40; i++) {
      const daysAgo = Math.floor(60 - (i * 60) / 40);
      const lectureDate = new Date(today);
      lectureDate.setDate(lectureDate.getDate() - daysAgo);

      const lectureId = `lecture-${lectureIdCounter}`;
      database.lectures.set(lectureId, {
        id: lectureId,
        subjectId: subject.id,
        date: lectureDate,
        lectureNumber: i + 1,
      });

      lectureIdCounter++;
    }
  });

  // Create realistic attendance data
  const lectures = Array.from(database.lectures.values());
  const enrollments = Array.from(database.enrollments.values());

  enrollments.forEach((enrollment) => {
    const enrollmentLectures = lectures.filter((l) => l.subjectId === enrollment.subjectId);

    const rand = Math.random();
    let attendanceRate: number;

    if (rand < 0.3) {
      attendanceRate = 0.85 + Math.random() * 0.15;
    } else if (rand < 0.8) {
      attendanceRate = 0.7 + Math.random() * 0.15;
    } else {
      attendanceRate = 0.4 + Math.random() * 0.3;
    }

    enrollmentLectures.forEach((lecture, idx) => {
      const recencyBoost = idx / enrollmentLectures.length * 0.1;
      const adjustedPresent = Math.random() < Math.min(attendanceRate + recencyBoost, 0.95);

      const attendanceId = `attendance-${enrollment.studentId}-${lecture.id}`;
      database.attendance.set(attendanceId, {
        id: attendanceId,
        studentId: enrollment.studentId,
        lectureId: lecture.id,
        status: adjustedPresent ? 'present' : 'absent',
        markedAt: new Date(lecture.date),
      });
    });
  });

  console.log(`[v0] Database seeded with ${studentIndex} students, ${teachers.length} teachers, ${subjects_list.length} subjects`);
}
