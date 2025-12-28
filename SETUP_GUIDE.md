# Schoolwise Hub - Setup & Usage Guide

## Quick Start

### Prerequisites
- Node.js (v18+)
- Supabase account
- Clerk authentication account
- npm or yarn package manager

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Run the migration file: `supabase/migrations/20251226_add_missing_tables.sql`
   - This creates all necessary tables and RLS policies

3. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Admin Features Usage

### Setting up School Information
1. Navigate to **Settings** → **School Information**
2. Fill in:
   - School Name
   - Contact Email
   - Phone Number
   - Address
   - School Description
3. Click **Save Changes**

### Creating Academic Year
1. Go to **Academic Years**
2. Click **Add Academic Year**
3. Enter Year Name (e.g., "2024/2025")
4. Set Start and End dates
5. Mark as current year if applicable
6. Click **Add Year**

### Adding Classes
1. Navigate to **Classes**
2. Click **Add Class**
3. Configure:
   - Class Name (e.g., "Grade 10A")
   - Grade Level (1-12)
   - Section (Optional)
   - Capacity (Optional)
   - Academic Year (Required)
4. Click **Add Class**

### Creating Subjects
1. Go to **Subjects**
2. Click **Add Subject**
3. Enter:
   - Subject Code (Optional, e.g., "ENG101")
   - Subject Name (Required)
   - Description (Optional)
4. Click **Add Subject**

### Setting Up Fee Structure
1. Navigate to **Fee Structure**
2. Click **Add Fee Category**
3. Configure:
   - Category Name (e.g., "Tuition Fee")
   - Amount (in your currency)
   - Description (Optional)
4. Click **Add Category**

### Creating Timetable
1. Go to **Timetable**
2. Click **Create Timetable Entry**
3. Configure:
   - Class (Required)
   - Subject (Required)
   - Teacher (Required)
   - Day of Week (Required)
   - Start Time (Required)
   - End Time (Required)
   - Room/Venue (Optional)
4. Click **Create Entry**

### Viewing & Exporting Fee Reports
1. Navigate to **Fee Reports**
2. View payment summary cards:
   - Total Revenue
   - Successful Payments
   - Total Transactions
3. Export options:
   - Click **Export PDF** for PDF report
   - Click **Export CSV** for CSV format
4. View detailed payment table

### Managing Results
1. Go to **Results Management**
2. Click **New Exam Term** to create terms
3. Switch to **Review Scores** tab
4. Select an exam term
5. View all submitted scores
6. Click **Publish Results** when ready

## Teacher Features Usage

### Dashboard Quick Actions
From the Teacher Dashboard, use quick action buttons:
- **Mark Attendance** - Go to attendance marking page
- **My Classes** - View assigned classes
- **Gradebook** - Enter and manage student scores
- **Create Assignment** - Create student assignments

### Marking Attendance
1. Click **Mark Attendance**
2. Select Class from dropdown
3. Choose Date (defaults to today)
4. Toggle each student's attendance status
5. Click **Save Attendance**

### Viewing Your Classes
1. Click **My Classes**
2. View all assigned classes with:
   - Class Name
   - Grade Level
   - Section (if available)
   - Student Count

### Entering Student Scores
1. Click **Gradebook**
2. Select a class from dropdown
3. View all students in the class
4. Click edit icon (save icon) next to each student
5. Enter scores for:
   - Class Work
   - Quiz
   - Exam
   - Attendance
6. Score and grade auto-calculate
7. Click **Save Score**

## Parent Features Usage

### Accessing Parent Dashboard
1. Login with parent account
2. View children overview cards showing:
   - Child's name
   - Grade/Class
   - Attendance percentage
   - GPA

### Viewing Academic Results
1. Click **Academic Results** tab
2. See all subjects with:
   - Subject name
   - Score achieved
   - Grade letter
   - Teacher name

### Checking Fee Payments
1. Click **Fee Payments** tab
2. View payment history:
   - Student name
   - Payment amount
   - Payment date
   - Payment status

### Monitoring Attendance
1. Click **Attendance** tab
2. View monthly attendance records:
   - Month period
   - Attendance status
   - Attendance percentage

### Using Quick Actions
Available quick action buttons:
- View Grades
- Attendance Records
- Fee Payment
- Contact Teacher

### Checking Recent Updates
- See latest grade notifications
- View attendance confirmations
- Get fee payment reminders
- Stay informed about school events

### Upcoming Events
View important school events:
- Parent-Teacher meetings
- Examination dates
- Fee payment deadlines
- School calendar items

## Database Notes

### Row Level Security (RLS)
All tables have RLS enabled with role-based policies:
- **Admin**: Full access to all tables
- **Teacher**: Access to assigned classes and attendance
- **Parent**: View-only access to their children's data
- **Student**: Limited access to their own records

### Data Relationships
```
Academic Years
    ├── Classes
    │   ├── Students
    │   ├── Timetables
    │   └── Attendance
    ├── Subjects
    │   └── Timetables
    │       └── Student Scores
    ├── Exam Terms
    │   └── Student Scores
    └── Teachers
        ├── Class Assignments
        ├── Timetables
        └── Student Scores
```

## Common Tasks

### Assign Teacher to Class
1. Admin adds class
2. Use **Class Assignments** to link teacher
3. Teacher can then see class in "My Classes"

### Record Student Payment
1. Admin navigates to **Fee Reports**
2. Payments are auto-recorded via payment system
3. Parents see payments in their dashboard

### Set Current Academic Year
1. Go to **Academic Years**
2. When creating year, check **Set as current**
3. System uses this for current scores/attendance

### Update School Information
1. Go to **Settings**
2. Edit any field
3. Click **Save Changes**
4. Data instantly updates in database

## Troubleshooting

### Tables Not Found
- Ensure migrations have been run on Supabase
- Check migration file exists in proper location

### Permission Denied Errors
- Verify user role is set correctly
- Check RLS policies in Supabase
- Ensure user has proper authentication

### Data Not Saving
- Check browser console for errors
- Verify internet connection
- Confirm Supabase credentials
- Check database quota

### Missing Data
- Verify data was entered with all required fields
- Check filters/searches aren't hiding data
- Refresh browser page
- Check user permissions

## Support & Next Steps

### Features Ready for Enhancement
1. **Communication System** - Messages between parents and teachers
2. **Advanced Analytics** - Detailed performance dashboards
3. **Assignment System** - Create and track assignments
4. **Exam Scheduling** - Automated exam timetable generation
5. **Report Cards** - Automated report generation
6. **Notification System** - Email/SMS alerts

### Database Optimization
- Add indexes on frequently queried columns
- Archive old attendance/score data periodically
- Monitor database size and cleanup

### Performance Improvements
- Implement data pagination for large lists
- Add search and filtering on major tables
- Cache frequently accessed data
- Consider infinite scroll for mobile

---

**Last Updated:** December 26, 2025
**Version:** 1.0 - Initial Implementation
