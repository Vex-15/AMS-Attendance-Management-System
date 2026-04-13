# System Architecture - MITAOE Attendance & Intelligence System

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Next.js)                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Login Page   │  │ Student      │  │ Teacher      │  ┌─────┐  │
│  │              │  │ Dashboard    │  │ Dashboard    │  │Admin│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────┘  │
│                                                                   │
│  Context API: AuthProvider (state management)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (HTTP/REST)
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Next.js Routes)                  │
│                                                                   │
│  /api/auth/login          → Authentication                      │
│  /api/student/analytics   → Student analytics                   │
│  /api/student/simulate    → Attendance simulation               │
│  /api/teacher/class-analytics → Class performance               │
│  /api/teacher/mark-attendance → Record attendance               │
│  /api/search/students     → Student search & filter             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (TypeScript)                   │
│                                                                   │
│  Analytics Services                                              │
│  ├── getAttendanceStats()        - Calculate attendance %       │
│  ├── calculateClassesNeeded()    - Classes needed solver        │
│  ├── analyzeTrend()              - Trend detection              │
│  ├── simulateMissingClasses()    - What-if simulator            │
│  └── getClassAnalytics()         - Teacher class metrics        │
│                                                                   │
│  Search & Filter Services                                        │
│  ├── searchStudents()            - Student search               │
│  └── filterAttendanceByStatus()  - Status filtering             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (In-Memory Database)              │
│                                                                   │
│  In-Memory Maps (File-Backed)                                   │
│  ├── users        (1 Admin + 100+ Students + 12+ Teachers)     │
│  ├── students     (100+ with branch/year/division)             │
│  ├── teachers     (12+ with department assignments)            │
│  ├── subjects     (12 across branches/years)                   │
│  ├── enrollments  (1000+ student-subject relationships)        │
│  ├── lectures     (480+ across all subjects)                   │
│  └── attendance   (48,000+ records with realistic distribution)│
│                                                                   │
│  Persistence: data/db.json                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components Structure

```
app/
├── page.tsx (Login)
├── layout.tsx (Root with Providers)
├── globals.css (Design tokens & theme)
│
├── dashboard/
│   ├── student/page.tsx
│   │   └── Features:
│   │       - Subject tabs with detailed analytics
│   │       - Classes needed calculator
│   │       - What-if simulator
│   │       - Trend analysis display
│   │       - Status badges (Safe/Warning/At Risk)
│   │
│   ├── teacher/page.tsx
│   │   └── Features:
│   │       - Multi-subject selector
│   │       - Student attendance table
│   │       - Class average & trend chart
│   │       - Lowest performers list
│   │       - Daily attendance summary
│   │
│   ├── admin/page.tsx
│   │   └── Features:
│   │       - System statistics overview
│   │       - Database entity counts
│   │       - User management view
│   │       - System health status
│   │
│   └── analytics/page.tsx
│       └── Features:
│           - Student search & filter
│           - Status distribution chart
│           - Detailed subject analytics
│           - Export-ready tables
│
└── api/
    ├── auth/login → POST
    ├── student/analytics → GET
    ├── student/simulate → POST
    ├── teacher/class-analytics → GET
    ├── teacher/mark-attendance → POST
    └── search/students → GET

components/
├── ui/ (shadcn/ui components)
├── providers.tsx (AuthProvider wrapper)
├── student-nav.tsx (Student sidebar/header)
├── teacher-nav.tsx (Teacher sidebar/header)
└── admin-nav.tsx (Admin sidebar/header)

lib/
├── auth-context.tsx (Auth state management)
├── db.ts (Database layer & seeding)
├── services.ts (Analytics & intelligence services)
└── utils.ts (Utility functions)
```

## Data Flow Diagrams

### Student Login & Dashboard Load

```
┌─────────────┐
│ User enters │
│ credentials │
└──────┬──────┘
       │
       ├──→ /api/auth/login (POST)
       │
       ├──→ Database.users lookup
       │
       ├──→ Validate credentials
       │
       └──→ Return user + roleData
            │
            ├→ localStorage.setItem('mitaoe_user')
            │
            ├→ AuthContext updated
            │
            └→ Redirect to /dashboard/student
                │
                ├──→ Fetch /api/student/analytics
                │
                ├──→ Calculate stats for each subject
                │
                ├──→ Perform trend analysis
                │
                ├──→ Generate predictions
                │
                └──→ Render dashboard with data
```

### Attendance Analytics Calculation

```
Request: GET /api/student/analytics?studentId=X

1. Get all attendance records for student
   │
   ├─ Filter by subject (if needed)
   │
   ├─ Count: present, absent, total
   │
   └─ Calculate percentage = (present/total) * 100

2. Determine status
   │
   ├─ If < 75%  → At Risk (Red)
   ├─ If 75-85% → Warning (Yellow)
   └─ If > 85%  → Safe (Green)

3. Calculate classes needed
   │
   └─ Solve: (present + x) / (total + x) = 0.75
              for x ≥ 0

4. Analyze trend
   │
   ├─ Get last 5 lectures for subject
   ├─ Get previous 5 lectures
   ├─ Calculate attendance rate for each
   └─ Detect: improving/declining/stable

5. Generate prediction
   │
   └─ Apply trend to current status
      for estimated future percentage

Response: Full analytics with all metrics
```

### What-If Simulation

```
Request: POST /api/student/simulate
Body: { studentId, subjectId, classesToMiss }

1. Get current attendance stats
   │
   └─ present, total, percentage

2. Simulate missing N classes
   │
   ├─ new_total = total + classesToMiss
   │
   └─ new_percentage = present / new_total * 100

3. Check target achievement
   │
   └─ willReachTarget = (new_percentage >= 75)

Response: { currentPercentage, predictedPercentage, willReachTarget }
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│                  LOGIN PROCESS                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. User enters email & password                   │
│     └─ Submit to /api/auth/login (POST)           │
│                                                     │
│  2. Backend validation                            │
│     └─ Find user by email + password             │
│                                                     │
│  3. Success                                       │
│     ├─ Get roleData (student/teacher/teacher)     │
│     └─ Return { user, roleData }                  │
│                                                     │
│  4. Frontend storage                              │
│     ├─ localStorage.setItem('mitaoe_user')       │
│     ├─ localStorage.setItem('mitaoe_roleData')   │
│     └─ Update AuthContext                        │
│                                                     │
│  5. Navigation                                    │
│     ├─ If student → /dashboard/student           │
│     ├─ If teacher → /dashboard/teacher           │
│     └─ If admin → /dashboard/admin               │
│                                                     │
│  LOGOUT PROCESS                                    │
│  ├─ Clear localStorage                           │
│  ├─ Clear AuthContext                            │
│  └─ Redirect to / (login page)                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Database Schema Details

### Users Table
```sql
CREATE TABLE users (
  id: string PRIMARY KEY,
  name: string NOT NULL,
  email: string UNIQUE NOT NULL,
  password: string NOT NULL,
  role: 'student' | 'teacher' | 'admin',
  createdAt: Date
);
```

### Students Table
```sql
CREATE TABLE students (
  id: string PRIMARY KEY,
  userId: string FOREIGN KEY → users(id),
  branch: string ('Computer Engineering' | 'Data Science' | 'AI & ML'),
  year: number (1-4),
  division: string ('A' | 'B' | 'C')
);
```

### Teachers Table
```sql
CREATE TABLE teachers (
  id: string PRIMARY KEY,
  userId: string FOREIGN KEY → users(id),
  department: string,
  subjects: string[] (subject IDs)
);
```

### Subjects Table
```sql
CREATE TABLE subjects (
  id: string PRIMARY KEY,
  name: string NOT NULL,
  code: string UNIQUE NOT NULL,
  teacherId: string FOREIGN KEY → teachers(id),
  branch: string,
  year: number
);
```

### Enrollments Table
```sql
CREATE TABLE enrollments (
  id: string PRIMARY KEY,
  studentId: string FOREIGN KEY → students(id),
  subjectId: string FOREIGN KEY → subjects(id),
  enrolledAt: Date,
  UNIQUE(studentId, subjectId)
);
```

### Lectures Table
```sql
CREATE TABLE lectures (
  id: string PRIMARY KEY,
  subjectId: string FOREIGN KEY → subjects(id),
  date: Date,
  lectureNumber: number
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id: string PRIMARY KEY,
  studentId: string FOREIGN KEY → students(id),
  lectureId: string FOREIGN KEY → lectures(id),
  status: 'present' | 'absent',
  markedAt: Date,
  UNIQUE(studentId, lectureId)
);
```

## API Response Types

### Student Analytics Response
```typescript
{
  analytics: [
    {
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
      };
      trend: {
        estimatedPercentage: number;
        trend: 'improving' | 'declining' | 'stable';
        trendMessage: string;
      };
    }
  ]
}
```

### Class Analytics Response
```typescript
{
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalStudents: number;
  classAverage: number;
  lowestPerformers: StudentStats[];
  dailyAttendance: DailyAttendance[];
  recentLectures: number;
}
```

## Performance Considerations

### Data Retrieval
- **Search**: Limited to 20 results for performance
- **Analytics**: Computed on-demand with caching via React Query (future enhancement)
- **Filtering**: Done in-memory for speed

### UI Optimization
- **Lazy Loading**: Dashboards load analytics asynchronously
- **Component Splitting**: Separate components for each dashboard section
- **Recharts**: Efficient charting with ResponsiveContainer

### Database
- **In-Memory Storage**: O(1) lookups via Maps
- **Indexes**: Keys optimized for common queries
- **Batch Operations**: Attendance marking supports bulk updates

## Security Architecture

### Current Implementation (Demo)
- Session management via localStorage
- No encryption for demo passwords
- Client-side validation only

### Production Recommendations
```
1. Authentication
   ├─ Hash passwords with bcrypt
   ├─ Implement JWT tokens
   └─ Use HTTP-only secure cookies

2. Authorization
   ├─ Row-Level Security (RLS) policies
   ├─ Role-based access control (RBAC)
   └─ API endpoint guards

3. Data Protection
   ├─ HTTPS/TLS encryption
   ├─ CORS configuration
   ├─ Parameterized queries
   └─ Input validation & sanitization

4. Audit Logging
   ├─ Track all attendance changes
   ├─ Log admin actions
   └─ Compliance reporting
```

## Scalability Path

### Current Limitations
- Single-process in-memory database
- No horizontal scaling
- File-based persistence for single instance

### Growth Path
```
Phase 1 (Current)
└─ In-memory with file persistence
   Supports: 1000 concurrent users

Phase 2 (PostgreSQL)
├─ Migrate to relational database
├─ Add connection pooling
└─ Supports: 10,000 concurrent users

Phase 3 (Distributed)
├─ Microservices architecture
├─ Caching layer (Redis)
├─ Message queues (Bull/Kafka)
└─ Supports: 100,000+ concurrent users

Phase 4 (Advanced Analytics)
├─ ML-based predictions
├─ Real-time analytics
└─ Distributed data processing
```

## Technology Rationale

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | Next.js | SSR/SSG, API routes, excellent DX |
| Styling | Tailwind CSS | Utility-first, responsive, customizable |
| UI Libs | shadcn/ui | Accessible, customizable, production-ready |
| Charts | Recharts | React-native, responsive, simple API |
| State | Context API | Simple for demo, scalable with Redux |
| Database | In-Memory Maps | Fast, simple, file-backed for persistence |
| Auth | Custom | Transparent, suitable for educational project |

## Future Enhancements

1. **Real Database Integration**: PostgreSQL with Prisma ORM
2. **Advanced Caching**: Redis for session & data caching
3. **Message Queues**: Bull for async notifications
4. **ML Integration**: TensorFlow.js for better predictions
5. **Mobile App**: React Native for iOS/Android
6. **Real-time Updates**: WebSockets for live attendance
7. **Advanced Reporting**: PDF export, scheduled reports
8. **API Documentation**: OpenAPI/Swagger specs
9. **Testing**: Jest + React Testing Library
10. **Monitoring**: Sentry for error tracking

---

**Designed for clarity, scalability, and production readiness.**
