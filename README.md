# MITAOE Smart Attendance & Academic Intelligence System

A production-grade full-stack web application for tracking student attendance, analyzing academic performance, and providing intelligent insights to help students maintain healthy attendance and improve academically.

## System Overview

This is not a simple attendance tracker—it's a **role-based academic intelligence platform** that provides:

- **Real-time attendance tracking** with a normalized relational database
- **Advanced analytics and insights** for students, teachers, and administrators
- **Risk detection and prediction systems** to identify at-risk students early
- **What-if simulation tools** for attendance planning
- **Trend analysis** to track improving or declining attendance patterns
- **Professional SaaS-style dashboard UI** resembling enterprise ERP systems

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charting**: Recharts
- **State Management**: React Context API + localStorage
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **API Framework**: Next.js API Routes (Express-style)
- **Architecture**: Modular service-based design
- **Data Persistence**: In-memory with file-based backup

### Database
- **Structure**: Fully normalized relational schema
- **Tables**: 8 entities with proper constraints and indexes
- **Seed Data**: 48,000+ realistic institutional records
  - 100+ students across 3 branches, 4 years, 3 divisions
  - 12+ teachers and faculty members
  - 12 diverse academic subjects
  - 480+ lectures with realistic dates
  - Complete attendance records with realistic distributions

## Database Schema

```
users (id, name, email, password, role, createdAt)
students (id, userId, branch, year, division)
teachers (id, userId, department, subjects)
subjects (id, name, code, teacherId, branch, year)
enrollments (id, studentId, subjectId, enrolledAt)
lectures (id, subjectId, date, lectureNumber)
attendance (id, studentId, lectureId, status, markedAt)
```

### Data Constraints
- Primary keys on all entities
- Foreign keys with referential integrity
- UNIQUE constraint: (studentId, lectureId) in attendance
- Indexes on frequently queried fields (userId, studentId, subjectId)

## Features

### Intelligence & Analytics Features

#### 1. Attendance Percentage Calculation
- Formula: `(present / total_lectures) × 100`
- Accurate to 2 decimal places
- Updates in real-time as attendance is marked

#### 2. Risk Detection System
- **At Risk** (Red): < 75% attendance
- **Warning** (Yellow): 75% - 85% attendance
- **Safe** (Green): > 85% attendance
- Color-coded badges throughout the interface

#### 3. Classes Needed Calculator
- Solves: `(present + x) / (total + x) ≥ 0.75`
- Shows exact number of classes needed to reach 75%
- Accounts for future lectures

#### 4. Trend Analysis
- Compares last 5 lectures vs previous 5 lectures
- Detects patterns: **Improving**, **Declining**, or **Stable**
- Provides actionable insights on attendance trajectory

#### 5. Prediction Model
- Estimates future attendance assuming current trend continues
- Generates risk status based on projection
- Helps students plan ahead

#### 6. What-If Simulator
- Input: "If I miss next N lectures"
- Output: Predicted new attendance percentage
- Shows whether student will maintain/reach 75% threshold
- Interactive slider for easy exploration

#### 7. Smart Alerts & Reminders
- "Attendance below 75% in [Subject]"
- "You are close to shortage"
- "Performance declining in [Subject]"
- Contextual badges and visual indicators

### Dashboard Features

#### Student Dashboard
- Subject-wise attendance overview with charts
- Individual subject analytics with status badges
- Classes needed calculator per subject
- Trend analysis with visual indicators
- What-if simulation tool
- Last lecture date and lecture count tracking
- Search and filtering by subject status (Safe/At Risk/Warning)

#### Teacher Dashboard
- Subject selector and enrollment overview
- Student attendance table with quick actions
- Class average attendance statistics
- Lowest performing students list (Top 5)
- Daily attendance trend chart (last 10 lectures)
- Bulk attendance marking interface
- Summary statistics

#### Admin Dashboard
- System-wide statistics overview
- Database entity counts and integrity verification
- User management view
- Subject and enrollment overview
- System health status
- Data density metrics

### Search & Filtering
- **Student Search**: By name, email, or ID
- **Filter Options**: 
  - By attendance status (At Risk/Warning/Safe)
  - By subject
  - By date range
  - Combined multi-filter support
- **Fast Search**: Optimized queries with 20-result limit

## Demo Accounts

The system comes with pre-configured demo accounts for testing all roles:

```
Student Accounts:
  Email: aarav.sharma0@mitaoe.edu.in
  Email: priya.patel1@mitaoe.edu.in
  Password: student123

Teacher Accounts:
  Email: deshmukh@mitaoe.edu.in
  Email: iyer@mitaoe.edu.in
  Password: teacher123

Admin Account:
  Email: admin@mitaoe.edu.in
  Password: admin123
```

All demo credentials are available on the login page for quick testing.

## Project Structure

```
app/
├── layout.tsx                      # Root layout with providers
├── page.tsx                        # Login page
├── globals.css                     # Global styles with design tokens
├── api/
│   ├── auth/
│   │   └── login/route.ts         # Authentication endpoint
│   ├── student/
│   │   ├── analytics/route.ts     # Student analytics API
│   │   └── simulate/route.ts      # Attendance simulator API
│   ├── teacher/
│   │   ├── class-analytics/route.ts # Teacher class analytics
│   │   └── mark-attendance/route.ts # Attendance marking API
│   └── search/
│       └── students/route.ts      # Student search API
└── dashboard/
    ├── student/page.tsx           # Student dashboard
    ├── teacher/page.tsx           # Teacher dashboard
    ├── admin/page.tsx             # Admin dashboard
    └── analytics/page.tsx         # Analytics & search page

components/
├── ui/                            # shadcn/ui components
├── providers.tsx                  # Auth provider wrapper
├── student-nav.tsx                # Student navigation
├── teacher-nav.tsx                # Teacher navigation
└── admin-nav.tsx                  # Admin navigation

lib/
├── db.ts                          # Database layer with seed data
├── services.ts                    # Intelligence & analytics services
├── auth-context.tsx               # Authentication context
└── utils.ts                       # Utility functions
```

## API Endpoints

### Authentication
```
POST /api/auth/login
  Body: { email, password }
  Returns: { user, roleData }
```

### Student APIs
```
GET /api/student/analytics?studentId=<id>
  Returns: { analytics: SubjectAnalytics[] }

POST /api/student/simulate
  Body: { studentId, subjectId, classesToMiss }
  Returns: { currentPercentage, predictedPercentage, willReachTarget }
```

### Teacher APIs
```
GET /api/teacher/class-analytics?teacherId=<id>[&subjectId=<id>]
  Returns: { subjects: ClassAnalytics[] } or ClassAnalytics

POST /api/teacher/mark-attendance
  Body: { lectureId, attendanceData: [{studentId, status}] }
  Returns: { success, markedCount }
```

### Search APIs
```
GET /api/search/students?query=<name/email>
  Returns: { results: SearchResult[] }
```

## Running the Application

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation
```bash
# Clone repository
git clone <repo-url>
cd <project-folder>

# Install dependencies
npm install
# or
pnpm install
```

### Development Server
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## Data Persistence

The system uses in-memory storage with automatic file-based persistence:

- Database state is saved to `data/db.json` in the project root
- On application restart, the database auto-loads from the saved state
- All changes are immediately persisted to file

## Color System

Professional dark/light mode compatible theme:

- **Primary**: Deep blue (`oklch(0.445 0.13 264)`)
- **Accent**: Orange (`oklch(0.6 0.2 24)`)
- **Neutral**: Professional grays
- **Status Colors**:
  - Green (Safe): `#10b981`
  - Yellow (Warning): `#f59e0b`
  - Red (At Risk): `#ef4444`

## Design Principles

- **Professional**: Enterprise ERP system aesthetic
- **Clean**: Minimal, focused interface
- **Accessible**: Full WCAG 2.1 compliance with semantic HTML
- **Responsive**: Mobile-first, works on all screen sizes
- **Performance**: Optimized components and efficient data flow

## Intelligence Algorithms

### Classes Needed Formula
```
Given:
  - present = lectures attended
  - total = total lectures held
  - target = 75%

Solve for x (classes needed to attend):
  (present + x) / (total + x) = 0.75
  
Solution:
  x = ((0.75 * total) - present) / (1 - 0.75)
  x = ((0.75 * total) - present) / 0.25
```

### Trend Analysis
```
recent_rate = (present in last 5) / 5
previous_rate = (present in previous 5) / 5

If recent > previous + 5% → Improving
If recent < previous - 5% → Declining
Otherwise → Stable
```

### Risk Prediction
```
If current_percentage < 75:
  estimated = current + (5 if improving, -5 if declining, 0 if stable)
  
Risk Status determined by estimated percentage
```

## Security Notes

- In demo mode, passwords are stored in plain text for simplicity
- In production, implement bcrypt password hashing
- Add session/JWT authentication with HTTP-only cookies
- Implement Row Level Security (RLS) policies
- Use parameterized queries to prevent SQL injection
- Add comprehensive input validation and sanitization

## Future Enhancements

- Integration with institutional ERP systems
- Email/SMS notifications for attendance alerts
- Customizable attendance policies
- Advanced predictive analytics using ML models
- Automated report generation (PDF/Excel)
- Mobile app for quick attendance marking
- Real-time attendance marking via QR codes
- Parent/guardian notifications
- Integration with payment systems for late fee tracking
- Advanced filtering and export functionality

## License

This project is proprietary to MIT Academy of Engineering, Pune.

## Support

For issues and feature requests, contact the administration or IT department.

---

**Built with attention to detail and production-quality standards.**
#   A M S - A t t e n d a n c e - M a n a g e m e n t - S y s t e m  
 