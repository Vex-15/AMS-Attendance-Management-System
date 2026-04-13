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
  branch: string; // Computer Engineering, Data Science, AI & ML
  year: number; // 1-4 (FE, SE, TE, BE)
  division: string; // A, B, C
}

export interface Teacher {
  id: string;
  userId: string;
  department: string;
  subjects: string[]; // subject IDs (each teacher handles 1 subject across multiple divisions)
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  branch: string;
  year: number;
  division: string; // A, B, C — each row is subject+division combo
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
  status: 'present' | 'absent';
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

// No-op for in-memory DB — exists for API route compatibility
export function saveDB(): void {
  // In-memory DB is always "saved"
}

// ============= SUBJECT DEFINITIONS (5 per branch-year) =============
interface SubjectDef {
  name: string;
  code: string;
  shortName: string;
}

const SUBJECT_CATALOG: Record<string, Record<number, SubjectDef[]>> = {
  'Computer Engineering': {
    1: [
      { name: 'Engineering Mathematics-I', code: 'CE101', shortName: 'Maths-I' },
      { name: 'Engineering Physics', code: 'CE102', shortName: 'Physics' },
      { name: 'Engineering Chemistry', code: 'CE103', shortName: 'Chemistry' },
      { name: 'Basic Electronics', code: 'CE104', shortName: 'Electronics' },
      { name: 'Programming Fundamentals', code: 'CE105', shortName: 'Programming' },
    ],
    2: [
      { name: 'Data Structures & Algorithms', code: 'CE201', shortName: 'DSA' },
      { name: 'Database Management Systems', code: 'CE202', shortName: 'DBMS' },
      { name: 'Operating Systems', code: 'CE203', shortName: 'OS' },
      { name: 'Computer Networks', code: 'CE204', shortName: 'CN' },
      { name: 'Mathematics-III', code: 'CE205', shortName: 'Maths-III' },
    ],
    3: [
      { name: 'Compiler Design', code: 'CE301', shortName: 'CD' },
      { name: 'Software Engineering', code: 'CE302', shortName: 'SE' },
      { name: 'Distributed Systems', code: 'CE303', shortName: 'DS' },
      { name: 'Artificial Intelligence', code: 'CE304', shortName: 'AI' },
      { name: 'Machine Learning', code: 'CE305', shortName: 'ML' },
    ],
    4: [
      { name: 'Cloud Computing', code: 'CE401', shortName: 'Cloud' },
      { name: 'Deep Learning', code: 'CE402', shortName: 'DL' },
      { name: 'Cyber Security', code: 'CE403', shortName: 'CySec' },
      { name: 'Project Management', code: 'CE404', shortName: 'PM' },
      { name: 'Advanced Algorithms', code: 'CE405', shortName: 'AdvAlgo' },
    ],
  },
  'Data Science': {
    1: [
      { name: 'Engineering Mathematics-I', code: 'DS101', shortName: 'Maths-I' },
      { name: 'Engineering Physics', code: 'DS102', shortName: 'Physics' },
      { name: 'Engineering Chemistry', code: 'DS103', shortName: 'Chemistry' },
      { name: 'Basic Electronics', code: 'DS104', shortName: 'Electronics' },
      { name: 'Intro to Data Science', code: 'DS105', shortName: 'IntroDI' },
    ],
    2: [
      { name: 'Data Structures & Algorithms', code: 'DS201', shortName: 'DSA' },
      { name: 'Database Management Systems', code: 'DS202', shortName: 'DBMS' },
      { name: 'Statistical Methods', code: 'DS203', shortName: 'Stats' },
      { name: 'Data Visualization', code: 'DS204', shortName: 'DataViz' },
      { name: 'Mathematics-III', code: 'DS205', shortName: 'Maths-III' },
    ],
    3: [
      { name: 'Machine Learning', code: 'DS301', shortName: 'ML' },
      { name: 'Big Data Analytics', code: 'DS302', shortName: 'BigData' },
      { name: 'Natural Language Processing', code: 'DS303', shortName: 'NLP' },
      { name: 'Cloud Computing', code: 'DS304', shortName: 'Cloud' },
      { name: 'Data Mining', code: 'DS305', shortName: 'DataMin' },
    ],
    4: [
      { name: 'Deep Learning', code: 'DS401', shortName: 'DL' },
      { name: 'Reinforcement Learning', code: 'DS402', shortName: 'RL' },
      { name: 'MLOps & Deployment', code: 'DS403', shortName: 'MLOps' },
      { name: 'Research Methodology', code: 'DS404', shortName: 'ResM' },
      { name: 'AI Ethics & Governance', code: 'DS405', shortName: 'AIEthics' },
    ],
  },
  'AI & ML': {
    1: [
      { name: 'Engineering Mathematics-I', code: 'AI101', shortName: 'Maths-I' },
      { name: 'Engineering Physics', code: 'AI102', shortName: 'Physics' },
      { name: 'Engineering Chemistry', code: 'AI103', shortName: 'Chemistry' },
      { name: 'Basic Electronics', code: 'AI104', shortName: 'Electronics' },
      { name: 'Intro to AI', code: 'AI105', shortName: 'IntroAI' },
    ],
    2: [
      { name: 'Data Structures & Algorithms', code: 'AI201', shortName: 'DSA' },
      { name: 'Probability & Statistics', code: 'AI202', shortName: 'ProbStat' },
      { name: 'Linear Algebra', code: 'AI203', shortName: 'LinAlg' },
      { name: 'Computer Vision Basics', code: 'AI204', shortName: 'CV' },
      { name: 'Mathematics-III', code: 'AI205', shortName: 'Maths-III' },
    ],
    3: [
      { name: 'Artificial Intelligence', code: 'AI301', shortName: 'AI' },
      { name: 'Machine Learning', code: 'AI302', shortName: 'ML' },
      { name: 'Deep Learning', code: 'AI303', shortName: 'DL' },
      { name: 'Robotics & Automation', code: 'AI304', shortName: 'Robotics' },
      { name: 'NLP & Text Mining', code: 'AI305', shortName: 'NLP' },
    ],
    4: [
      { name: 'Generative AI', code: 'AI401', shortName: 'GenAI' },
      { name: 'Autonomous Systems', code: 'AI402', shortName: 'AutoSys' },
      { name: 'Edge AI', code: 'AI403', shortName: 'EdgeAI' },
      { name: 'AI Project Lab', code: 'AI404', shortName: 'ProjLab' },
      { name: 'AI Ethics & Safety', code: 'AI405', shortName: 'AISafety' },
    ],
  },
};

// ============= SEED DATA GENERATION =============
function seedDatabase(database: Database): void {
  const indianFirstNames = [
    'Aarav', 'Aditya', 'Arjun', 'Akshay', 'Anmol', 'Ashish', 'Aryan', 'Ankur',
    'Riya', 'Radha', 'Rupali', 'Rhea', 'Rina', 'Ritika', 'Ruhani',
    'Priya', 'Pooja', 'Pallavi', 'Payal', 'Purnima', 'Preeti', 'Pragati',
    'Neha', 'Nisha', 'Nikita', 'Nandini', 'Navya', 'Noor', 'Naina', 'Namita',
    'Sneha', 'Smriti', 'Sharanya', 'Sana', 'Shweta', 'Sakshi', 'Swati', 'Supriya',
    'Kunal', 'Karan', 'Keshav', 'Kavya', 'Khushi', 'Kriti',
    'Raj', 'Rahul', 'Rohan', 'Rishabh', 'Rohit', 'Raghav', 'Ranveer', 'Rajesh',
    'Ananya', 'Anjali', 'Avni', 'Aria', 'Anika', 'Anushka', 'Aparna',
    'Siddharth', 'Samir', 'Sandeep', 'Sanjay', 'Sameer', 'Suresh', 'Sumit',
    'Varun', 'Vihaan', 'Vikram', 'Vishal', 'Vivek', 'Vikas', 'Vaibhav',
    'Manish', 'Manoj', 'Mahesh', 'Madhav', 'Mayank', 'Mrigank',
    'Deepak', 'Dhaval', 'Dhruv', 'Devesh', 'Dilip', 'Dinesh', 'Darsh', 'Dev',
    'Harshita', 'Harini', 'Heena', 'Hina', 'Harsh', 'Harsha', 'Hansika',
  ];

  const lastNames = [
    'Sharma', 'Patel', 'Kulkarni', 'Iyer', 'Verma', 'Nair', 'Shah', 'Deshpande',
    'Jain', 'Gupta', 'Singh', 'Kumar', 'Rao', 'Reddy', 'Pillai', 'Menon',
    'Desai', 'Yadav', 'Pandey', 'Trivedi', 'Khanna', 'Bhat', 'Hegde', 'Bhatnagar',
  ];

  const branches = ['Computer Engineering', 'Data Science', 'AI & ML'];
  const divisions = ['A', 'B', 'C'];

  // ============= ADMIN =============
  database.users.set('user-admin-1', {
    id: 'user-admin-1',
    name: 'Dr. Rajendra Pawar',
    email: 'admin@mitaoe.edu.in',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date(),
  });

  // ============= TEACHERS (one teacher per unique subject name, teaches across divisions) =============
  const teacherNames = [
    'Prof. Deshmukh', 'Prof. Iyer', 'Prof. Kulkarni', 'Prof. Shah', 'Prof. Nair',
    'Prof. Singh', 'Prof. Verma', 'Prof. Rao', 'Prof. Patel', 'Prof. Reddy',
    'Prof. Mehta', 'Prof. Joshi', 'Prof. Bhat', 'Prof. Hegde', 'Prof. Menon',
    'Prof. Agarwal', 'Prof. Mishra', 'Prof. Tiwari', 'Prof. Saxena', 'Prof. Kapoor',
    'Prof. Choudhary', 'Prof. Banerjee', 'Prof. Chatterjee', 'Prof. Mukherjee', 'Prof. Das',
    'Prof. Bhatt', 'Prof. Srinivasan', 'Prof. Subramaniam', 'Prof. Krishnamurthy', 'Prof. Gopal',
    'Prof. Narayan', 'Prof. Rajan', 'Prof. Lakshmi', 'Prof. Sundaram', 'Prof. Venkatesh',
    'Prof. Anand', 'Prof. Bose', 'Prof. Dutta', 'Prof. Ghosh', 'Prof. Roy',
    'Prof. Sen', 'Prof. Mitra', 'Prof. Barua', 'Prof. Prasad', 'Prof. Chandra',
    'Prof. Mohan', 'Prof. Kamath', 'Prof. Shenoy', 'Prof. Pai', 'Prof. Navale',
    'Prof. Patwardhan', 'Prof. Gokhale', 'Prof. Sathe', 'Prof. Kelkar', 'Prof. Ranade',
    'Prof. Paranjape', 'Prof. Jog', 'Prof. Kale', 'Prof. Shirke', 'Prof. Gaikwad',
  ];

  let teacherIndex = 0;
  const teacherMap = new Map<string, string>(); // teacher name -> teacher id

  // Create subjects — one per branch-year-division combo
  let subjectIdCounter = 0;

  for (const branch of branches) {
    for (const year of [1, 2, 3, 4]) {
      const subjectDefs = SUBJECT_CATALOG[branch][year];

      for (const subDef of subjectDefs) {
        // This teacher teaches this subject across all divisions
        const teacherName = teacherNames[teacherIndex % teacherNames.length];
        const teacherEmail = `${teacherName.split('. ')[1].toLowerCase()}@mitaoe.edu.in`;
        const teacherId = `teacher-${teacherIndex}`;
        const userId = `user-teacher-${teacherIndex}`;

        if (!teacherMap.has(teacherName + teacherIndex)) {
          database.users.set(userId, {
            id: userId,
            name: teacherName,
            email: teacherEmail,
            password: 'teacher123',
            role: 'teacher',
            createdAt: new Date(),
          });

          database.teachers.set(teacherId, {
            id: teacherId,
            userId,
            department: branch,
            subjects: [],
          });

          teacherMap.set(teacherName + teacherIndex, teacherId);
        }

        // Create one subject entry per division (so teacher gets 3 classes: Div A, B, C)
        for (const division of divisions) {
          const subjectId = `subject-${subjectIdCounter}`;
          database.subjects.set(subjectId, {
            id: subjectId,
            name: subDef.name,
            code: subDef.code,
            teacherId,
            branch,
            year,
            division,
          });

          const teacher = database.teachers.get(teacherId)!;
          teacher.subjects.push(subjectId);

          subjectIdCounter++;
        }

        teacherIndex++;
      }
    }
  }

  // ============= STUDENTS (8 per division) =============
  let studentIndex = 0;
  const students: Array<{ id: string; userId: string; branch: string; year: number; division: string }> = [];

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
            id: userId, name, email,
            password: 'student123',
            role: 'student',
            createdAt: new Date(),
          });

          const studentId = `student-${studentIndex}`;
          database.students.set(studentId, {
            id: studentId, userId, branch, year, division,
          });

          students.push({ id: studentId, userId, branch, year, division });
          studentIndex++;
        }
      }
    }
  }

  // ============= ENROLLMENTS (exactly 5 per student) =============
  students.forEach((student) => {
    // Find subjects matching this student's branch, year, AND division
    const matchingSubjects = Array.from(database.subjects.values()).filter(
      (s) => s.branch === student.branch && s.year === student.year && s.division === student.division
    );

    // Should be exactly 5
    matchingSubjects.forEach((subject) => {
      const enrollmentId = `enrollment-${student.id}-${subject.id}`;
      database.enrollments.set(enrollmentId, {
        id: enrollmentId,
        studentId: student.id,
        subjectId: subject.id,
        enrolledAt: new Date(),
      });
    });
  });

  // ============= LECTURES (30 per subject, weekdays only, going back ~10 weeks) =============
  const today = new Date();
  let lectureIdCounter = 0;

  Array.from(database.subjects.values()).forEach((subject) => {
    let lectureNum = 0;
    let daysBack = 70; // ~10 weeks back

    while (lectureNum < 30 && daysBack >= 0) {
      const lectureDate = new Date(today);
      lectureDate.setDate(lectureDate.getDate() - daysBack);
      lectureDate.setHours(9, 0, 0, 0);

      const dayOfWeek = lectureDate.getDay();
      // Only Mon-Fri (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        lectureNum++;
        const lectureId = `lecture-${lectureIdCounter}`;
        database.lectures.set(lectureId, {
          id: lectureId,
          subjectId: subject.id,
          date: lectureDate,
          lectureNumber: lectureNum,
        });
        lectureIdCounter++;
      }
      daysBack--;
    }
  });

  // ============= ATTENDANCE DATA (realistic patterns) =============
  const lectures = Array.from(database.lectures.values());
  const enrollments = Array.from(database.enrollments.values());

  // Seeded random for reproducibility
  let seed = 42;
  function seededRandom() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  enrollments.forEach((enrollment, enrollIdx) => {
    const enrollmentLectures = lectures.filter((l) => l.subjectId === enrollment.subjectId);

    // Different student archetypes
    const archetype = seededRandom();
    let baseRate: number;

    if (archetype < 0.25) {
      baseRate = 0.88 + seededRandom() * 0.12; // Star students (88-100%)
    } else if (archetype < 0.65) {
      baseRate = 0.75 + seededRandom() * 0.13; // Average students (75-88%)
    } else if (archetype < 0.85) {
      baseRate = 0.65 + seededRandom() * 0.1; // Warning zone (65-75%)
    } else {
      baseRate = 0.40 + seededRandom() * 0.25; // At-risk students (40-65%)
    }

    enrollmentLectures.forEach((lecture) => {
      const dayOfWeek = lecture.date.getDay();

      // Monday absence boost (slightly higher absence on Mondays)
      let dayModifier = 0;
      if (dayOfWeek === 1) dayModifier = -0.08;
      if (dayOfWeek === 5) dayModifier = -0.04;

      // Recency boost (attendance slightly improves over time)
      const progress = enrollmentLectures.indexOf(lecture) / enrollmentLectures.length;
      const recencyBoost = progress * 0.05;

      // Exam week dips (around lecture 12-14 and 25-27)
      let examDip = 0;
      if (lecture.lectureNumber >= 12 && lecture.lectureNumber <= 14) examDip = -0.15;
      if (lecture.lectureNumber >= 25 && lecture.lectureNumber <= 27) examDip = -0.10;

      const finalRate = Math.min(0.98, Math.max(0.1, baseRate + dayModifier + recencyBoost + examDip));
      const isPresent = seededRandom() < finalRate;

      const attendanceId = `attendance-${enrollment.studentId}-${lecture.id}`;
      database.attendance.set(attendanceId, {
        id: attendanceId,
        studentId: enrollment.studentId,
        lectureId: lecture.id,
        status: isPresent ? 'present' : 'absent',
        markedAt: new Date(lecture.date),
      });
    });
  });

  // ============= INTENTIONAL PATTERNS =============
  applyIntentionalPatterns(database);

  // ============= VERIFY COUNTS =============
  const enrollmentCounts = new Map<string, number>();
  Array.from(database.enrollments.values()).forEach(e => {
    enrollmentCounts.set(e.studentId, (enrollmentCounts.get(e.studentId) || 0) + 1);
  });

  console.log(`[AMS] Database seeded: ${studentIndex} students, ${teacherIndex} teachers, ${subjectIdCounter} subjects, ${lectureIdCounter} lectures`);
  console.log(`[AMS] Enrollment verification: all students have 5 subjects = ${Array.from(enrollmentCounts.values()).every(c => c === 5)}`);
}

// Apply intentional attendance patterns for demo-quality data
function applyIntentionalPatterns(database: Database): void {
  const allStudents = Array.from(database.students.values());
  const allLectures = Array.from(database.lectures.values());

  function getStudentLectures(studentId: string) {
    const enrollments = Array.from(database.enrollments.values()).filter(
      (e) => e.studentId === studentId
    );
    const subjectIds = enrollments.map((e) => e.subjectId);
    return allLectures
      .filter((l) => subjectIds.includes(l.subjectId))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  function setAttendance(studentId: string, lectureId: string, status: 'present' | 'absent') {
    const id = `attendance-${studentId}-${lectureId}`;
    database.attendance.set(id, {
      id, studentId, lectureId, status,
      markedAt: new Date(),
    });
  }

  // Perfect attendance students (3)
  const cseYear2A = allStudents.filter(s => s.branch === 'Computer Engineering' && s.year === 2 && s.division === 'A');
  cseYear2A.slice(0, 3).forEach((student) => {
    getStudentLectures(student.id).forEach((lec) => setAttendance(student.id, lec.id, 'present'));
  });

  // Improving trend students (5)
  cseYear2A.slice(3, 8).forEach((student) => {
    const lectures = getStudentLectures(student.id);
    const third = Math.floor(lectures.length / 3);
    lectures.forEach((lec, idx) => {
      const rate = idx < third ? 0.58 : idx < third * 2 ? 0.74 : 0.90;
      setAttendance(student.id, lec.id, Math.random() < rate ? 'present' : 'absent');
    });
  });

  // Declining trend students (5)
  const cseYear2B = allStudents.filter(s => s.branch === 'Computer Engineering' && s.year === 2 && s.division === 'B');
  cseYear2B.slice(0, 5).forEach((student) => {
    const lectures = getStudentLectures(student.id);
    const third = Math.floor(lectures.length / 3);
    lectures.forEach((lec, idx) => {
      const rate = idx < third ? 0.93 : idx < third * 2 ? 0.75 : 0.58;
      setAttendance(student.id, lec.id, Math.random() < rate ? 'present' : 'absent');
    });
  });

  // Critically at-risk students (8)
  const cseYear2C = allStudents.filter(s => s.branch === 'Computer Engineering' && s.year === 2 && s.division === 'C');
  cseYear2C.slice(0, 8).forEach((student) => {
    getStudentLectures(student.id).forEach((lec) => {
      setAttendance(student.id, lec.id, Math.random() < 0.45 ? 'present' : 'absent');
    });
  });

  // Streak students (2 with 10+ day streaks)
  const now = new Date();
  cseYear2A.slice(0, 2).forEach((student) => {
    getStudentLectures(student.id).forEach((lec) => {
      const daysAgo = (now.getTime() - lec.date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo <= 18) setAttendance(student.id, lec.id, 'present');
    });
  });
}
