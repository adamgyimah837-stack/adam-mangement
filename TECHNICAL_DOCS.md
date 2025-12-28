# Technical Implementation Details

## Architecture Overview

### Component Structure
```
src/
├── pages/
│   ├── admin/
│   │   ├── Settings.tsx - School info management
│   │   ├── FeeReports.tsx - Financial reporting
│   │   ├── FeeStructure.tsx - Fee categories
│   │   ├── AcademicYears.tsx - Year management
│   │   ├── Classes.tsx - Class management
│   │   ├── Subjects.tsx - Subject management
│   │   ├── Timetable.tsx - Schedule management
│   │   └── ResultsManagement.tsx - Grade publishing
│   ├── teacher/
│   │   ├── Attendance.tsx - Mark attendance
│   │   ├── Gradebook.tsx - Enter/manage scores
│   │   └── MyClasses.tsx - View classes
│   └── dashboards/
│       ├── TeacherDashboard.tsx - Teacher home
│       └── ParentDashboard.tsx - Parent view
└── integrations/
    └── supabase/
        └── client.ts - Supabase initialization
```

## Data Flow

### Admin Settings Flow
```
Settings Component
    ↓
useState: formData, loading, saving
    ↓
useEffect: fetchSchoolInfo()
    ↓
Supabase: school_info.select().single()
    ↓
handleSaveChanges()
    ↓
Supabase: school_info.update() || insert()
    ↓
Toast notification + UI update
```

### Gradebook Score Flow
```
Teacher selects class
    ↓
fetchClassStudents()
    ↓
Supabase: student_scores.select()
    ↓
Display scores table
    ↓
Teacher clicks edit icon
    ↓
Dialog opens with score inputs
    ↓
handleUpdateScore()
    ↓
Calculate total & grade
    ↓
Supabase: student_scores.update()
    ↓
Refetch and display updated data
```

### Parent Dashboard Flow
```
Parent login
    ↓
useEffect: fetchParentData()
    ↓
Query students where parent_user_id = auth.id
    ↓
fetchResults() → student_scores.select()
    ↓
fetchFees() → payments.select()
    ↓
fetchAttendance() → attendance.select()
    ↓
Render tabs with data
```

## API Endpoints (Supabase RPC Functions)

All data is accessed through Supabase REST API with RLS policies.

### Key Tables & Operations

#### school_info
```typescript
GET /school_info?select=*
POST /school_info (insert)
PATCH /school_info?id=eq.{id} (update)
DELETE /school_info?id=eq.{id} (delete)
```

#### Classes
```typescript
GET /classes?select=*,academic_years(*)
GET /classes?class_id=eq.{classId}
POST /classes (insert)
PATCH /classes (update)
DELETE /classes?id=eq.{id}
```

#### student_scores
```typescript
GET /student_scores?class_id=eq.{classId}&select=*
POST /student_scores (insert)
PATCH /student_scores (update)
```

#### attendance
```typescript
GET /attendance?student_id=eq.{studentId}&date=eq.{date}
POST /attendance (upsert)
GET /attendance?class_id=eq.{classId}&date=eq.{date}
```

#### payments
```typescript
GET /payments?student_id=eq.{studentId}&select=*
GET /payments?status=eq.completed
POST /payments (insert)
```

## State Management Patterns

### Using React Query (useQuery)
```typescript
const { data: academicYears, isLoading, refetch } = useQuery({
  queryKey: ["academic-years"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) throw error;
    return data;
  },
});
```

### Using useState for Forms
```typescript
const [formData, setFormData] = useState({
  school_name: "",
  contact_email: "",
  phone_number: "",
  address: "",
  about: "",
});

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};
```

## Authentication & Authorization

### Role-Based Access Control (RBAC)

Implemented via Supabase RLS policies:

```sql
-- Example: Only admins can manage academic years
CREATE POLICY "Admins can manage academic years"
ON public.academic_years FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Teachers can view their assigned classes
CREATE POLICY "Teachers can view assigned classes"
ON public.classes FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  id IN (
    SELECT class_id FROM class_assignments ca
    WHERE ca.teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  )
);
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  const { error } = await supabase.from("table").operation();
  if (error) throw error;
  toast.success("Operation successful");
} catch (error) {
  console.error("Error:", error);
  toast.error("Operation failed");
} finally {
  setLoading(false);
}
```

### Error Messages
- Database errors → Toast with user-friendly message
- Validation errors → Form validation feedback
- Network errors → Automatic retry with toast notification

## Performance Optimizations

### 1. Query Caching
- React Query caches data automatically
- `refetch()` triggers fresh data fetch
- Cache invalidation on mutations

### 2. Lazy Loading
- Dialog components load data on-demand
- Tables paginate large datasets
- Images lazy-load below fold

### 3. Debouncing
- Search inputs debounce API calls
- Form inputs batch updates

### 4. Memoization
- Component memoization prevents re-renders
- Callback memoization with useCallback
- useMemo for expensive calculations

## Export Features

### PDF Export (jsPDF)
```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const doc = new jsPDF();
doc.text("Title", 14, 15);

autoTable(doc, {
  head: [["Col1", "Col2"]],
  body: tableData,
});

doc.save("filename.pdf");
```

### CSV Export
```typescript
const csvContent = [
  headers.join(","),
  ...rows.map(row => row.join(",")),
].join("\n");

const element = document.createElement("a");
element.href = "data:text/csv;" + encodeURIComponent(csvContent);
element.download = "filename.csv";
element.click();
```

## Type Safety

### TypeScript Interfaces

```typescript
interface SchoolInfo {
  id: string;
  school_name: string;
  contact_email: string;
  phone_number: string;
  address: string;
  about: string;
}

interface Grade {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
}
```

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Tailwind Classes Used
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` - Responsive grids
- `flex-col md:flex-row` - Responsive flexbox
- `hidden md:block` - Responsive visibility

## Testing Strategies

### Unit Testing
```typescript
// Test: School info save
test("should save school info", async () => {
  // Arrange
  const formData = { school_name: "Test School" };
  
  // Act
  await handleSaveChanges(formData);
  
  // Assert
  expect(toast.success).toHaveBeenCalled();
});
```

### Integration Testing
```typescript
// Test: Complete attendance workflow
test("mark and save attendance", async () => {
  // Select class
  await selectClass("Class1");
  
  // Mark students
  await toggleAttendance("Student1");
  
  // Save
  await handleSaveAttendance();
  
  // Verify saved in DB
  const data = await supabase.from("attendance").select();
  expect(data.length).toBeGreaterThan(0);
});
```

## Security Considerations

### 1. Authentication
- Clerk handles user authentication
- JWT tokens for API requests
- Secure session management

### 2. Authorization
- RLS policies enforce data access
- Users can only access their own data
- Role-based restrictions

### 3. Data Validation
- Input validation on frontend
- Database constraints on backend
- Type checking with TypeScript

### 4. XSS Prevention
- React escapes content automatically
- DomPurify for user-generated HTML

### 5. CSRF Protection
- Supabase CORS configuration
- Secure cookie settings

## Deployment Checklist

- [ ] Run database migrations
- [ ] Set environment variables
- [ ] Update Clerk configuration
- [ ] Configure Supabase CORS
- [ ] Test all features in staging
- [ ] Set up monitoring/logging
- [ ] Configure backups
- [ ] Enable SSL/TLS
- [ ] Performance testing
- [ ] Security audit

## Future Optimization Opportunities

1. **Implement Server-Side Pagination**
   - Load data in chunks
   - Reduce initial load time

2. **Add Service Workers**
   - Offline capability
   - Background sync

3. **Implement Real-Time Updates**
   - Supabase Realtime subscriptions
   - Live data synchronization

4. **Add Image Optimization**
   - Next.js Image component
   - WebP format
   - Responsive images

5. **Implement Search**
   - Full-text search on backend
   - Faceted filtering
   - Quick search

6. **Add Analytics**
   - User behavior tracking
   - Performance metrics
   - Error tracking

---

**Technical Version:** 1.0
**Last Updated:** December 26, 2025
**Maintainer:** Development Team
