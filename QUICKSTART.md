# Quick Start Guide - MITAOE Attendance System

Get up and running with the MITAOE Smart Attendance & Academic Intelligence System in minutes.

## 1. Login to the System

Open the application and you'll see the login page with demo accounts. Click on any demo account to instantly log in:

```
Student Demo:    aarav.sharma0@mitaoe.edu.in / student123
Teacher Demo:    deshmukh@mitaoe.edu.in / teacher123
Admin Demo:      admin@mitaoe.edu.in / admin123
```

## 2. Student Dashboard

Once logged in as a student, explore:

- **Subject Cards**: View attendance % for each subject with status (Safe/Warning/At Risk)
- **Attendance Chart**: Bar chart showing your attendance in each subject
- **Classes Needed**: See how many more classes you need to reach 75%
- **Trend Analysis**: Understand if your attendance is improving/declining
- **What-If Simulator**: Adjust a slider to see what happens if you miss N classes
- **Summary Stats**: Quick overview of your performance

### Key Student Features:
- Click on any subject tab to see detailed analytics
- Check "Classes Needed to Reach 75%" for each subject
- Use the simulator to plan ahead
- Color-coded status badges make it easy to identify at-risk subjects

## 3. Teacher Dashboard

For teacher accounts, view comprehensive class analytics:

- **Class Average Attendance**: Overall class attendance percentage
- **Attendance Trend**: Line chart showing attendance over last 10 lectures
- **At-Risk Students**: Table of 5 lowest performing students
- **Subject Selection**: Switch between different subjects you teach
- **Daily Summary**: See attendance percentage for each recent lecture

### Key Teacher Features:
- Monitor class performance at a glance
- Identify students who need intervention
- Track attendance trends over time
- View per-lecture attendance statistics

## 4. Admin Dashboard

Access system-wide management:

- **System Statistics**: Total users, students, teachers, subjects, lectures, enrollment data
- **System Status**: Health check and data integrity verification
- **Database Stats**: Detailed breakdown of all entities in the system
- **User Management**: View sample students, teachers, and subjects
- **Database Information**: Data density metrics and entity counts

### Key Admin Features:
- Monitor system health
- View complete institutional data
- Verify data integrity
- Access sample user information

## 5. Search & Analytics

Find any student and analyze their performance:

1. Go to "Student Search & Analytics" page
2. Type a student's name or email in the search box
3. Click on a student to load their detailed analytics
4. View their status distribution (pie chart)
5. See subject-wise attendance details in the table

## Understanding the Status Colors

- **Green (Safe)**: >85% attendance - No concerns
- **Yellow (Warning)**: 75-85% attendance - Monitor closely
- **Red (At Risk)**: <75% attendance - Requires intervention

## Key Metrics Explained

### Attendance Percentage
Formula: `(Classes Attended) / (Total Classes) × 100`
- Updated in real-time
- Shown for each subject and overall

### Classes Needed
How many more consecutive classes you need to attend to reach 75%:
- Formula solves: `(attended + x) / (total + x) ≥ 0.75`
- Shows "0" if already at target
- Helps students plan ahead

### Trend Analysis
Compares recent lectures vs past lectures:
- **Improving**: Getting better attendance recently
- **Declining**: Attendance getting worse
- **Stable**: Consistent attendance pattern

### Estimated Future Percentage
Predicts attendance if current trend continues:
- Based on recent vs previous lecture patterns
- Helps students understand trajectory
- Used to update risk status

## Sample Data

The system comes with realistic institutional data:

- **100+ Students**: Across 3 branches (CSE, Data Science, AI-ML), 4 years (FE-BE), 3 divisions (A, B, C)
- **12+ Teachers**: Faculty members with realistic names and assignments
- **12 Subjects**: Including DBMS, OS, Networks, DSA, AI, ML, and more
- **480 Lectures**: Spread across realistic academic dates with 40 per subject
- **48,000+ Attendance Records**: Complete student attendance data with realistic distributions

### Attendance Distribution
- 30% high attendance (85-100%)
- 50% medium attendance (70-85%)
- 20% low attendance (40-70%)

Some students show trends (improving/declining), making the data realistic and dynamic.

## Navigation

### From Login Page
- Click demo account buttons to log in instantly
- All accounts lead to their respective dashboards

### From Student Dashboard
- Click "MITAOE" logo to return home (logs out)
- Use subject tabs to view different subjects
- Interact with What-If Simulator for predictions

### From Teacher Dashboard
- Switch between subjects using subject tabs
- View different classes in a single interface

### From Admin Dashboard
- Use tabs to view Overview, Database Stats, or Users
- All data is read-only for safety

### From Search/Analytics
- Search for any student by name or email
- Select a student to load their complete analytics
- Switch between Overview and Details tabs

## Common Tasks

### Check your attendance in a subject
1. Log in as student
2. Click on the subject tab
3. See attendance %, present count, and status

### See if you'll reach 75% by end of semester
1. Use the "Classes Needed Calculator"
2. If it shows "0", you're already safe
3. Otherwise, attend that many consecutive classes

### Find a low-performing student
1. Log in as teacher
2. Scroll to "Students Needing Attention"
3. Click on a student name to see their analytics

### Check system data
1. Log in as admin
2. Go to Database Stats tab
3. See counts of all entities

## Tips & Tricks

1. **Color Coding**: Red = At Risk, Yellow = Warning, Green = Safe. Use colors to quickly identify issues.

2. **Simulation**: Play with the "What-If Simulator" to plan your attendance. Try different values to understand the impact.

3. **Search**: The search function is powerful - try searching for a student by first name, last name, or email.

4. **Trend Indicator**: Look at the trend icon next to "Trend Analysis" - arrow up means improving, arrow down means declining.

5. **Quick Stats**: The summary cards at the top of student dashboard show at-a-glance status for your entire academic performance.

## Troubleshooting

### Login fails
- Ensure you're using the exact email and password from demo accounts
- Try refreshing the page

### No data shows
- Ensure you're logged in properly (check top navigation)
- Try selecting a different subject/class
- Refresh the page and log in again

### Search returns no results
- Check spelling of student name
- Try searching by a different name (first name vs full name)
- Try searching by email

## What's Next?

Once you're comfortable with the system:

1. **Explore different roles**: Try all three demo accounts (student, teacher, admin) to understand each perspective
2. **Check the analytics**: Understand how attendance impacts your status
3. **Use the simulator**: Experiment with attendance predictions
4. **Read the README**: For detailed technical documentation

## Support

For detailed technical information, see [README.md](./README.md)

For questions about specific features, hover over icons or badges - many have tooltips with additional information.

---

**Ready to track your attendance smartly!**
