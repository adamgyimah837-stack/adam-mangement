import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Teacher routes
import ScoreEntry from "./pages/teacher/ScoreEntry";
import MyClasses from "./pages/teacher/MyClasses";
import MyTimetable from "./pages/teacher/MyTimetable";
import Submissions from "./pages/teacher/Submissions";
import MarkAttendance from "./pages/teacher/MarkAttendance";
import AttendanceHistory from "./pages/teacher/AttendanceHistory";
import TeacherAssignments from "./pages/teacher/Assignments";
import Exams from "./pages/teacher/Exams";

// Admin routes
import ResultsManagement from "./pages/admin/ResultsManagement";
import Students from "./pages/admin/Students";
import Teachers from "./pages/admin/Teachers";
import Parents from "./pages/admin/Parents";
import Roles from "./pages/admin/Roles";
import Classes from "./pages/admin/Classes";
import Subjects from "./pages/admin/Subjects";
import AcademicYears from "./pages/admin/AcademicYears";
import AdminTimetable from "./pages/admin/Timetable";
import Reports from "./pages/admin/Reports";
import DailyAttendance from "./pages/admin/DailyAttendance";
import AttendanceReports from "./pages/admin/AttendanceReports";
import FeeStructure from "./pages/admin/FeeStructure";
import Payments from "./pages/admin/Payments";
import FeeReports from "./pages/admin/FeeReports";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import BulkCreateUsers from "./pages/admin/BulkCreateUsers";

// Student routes
import MyResults from "./pages/student/MyResults";
import StudentClasses from "./pages/student/StudentClasses";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentAssignments from "./pages/student/StudentAssignments";
import ReportCard from "./pages/student/ReportCard";
import StudentAttendance from "./pages/student/StudentAttendance";

// Parent routes
import Children from "./pages/parent/Children";
import ChildrenAttendance from "./pages/parent/ChildrenAttendance";
import ChildrenGrades from "./pages/parent/ChildrenGrades";
import FeeStatus from "./pages/parent/FeeStatus";
import PaymentHistory from "./pages/parent/PaymentHistory";

// Shared routes
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    const role = user.publicMetadata?.role;
    if (!role) return;

    const upsertRole = async () => {
      try {
        const allowed = ["admin", "teacher", "student", "parent"] as const;
        if (!role || !allowed.includes(role as any)) return;

        await supabase
          .from<any>("user_roles")
          .upsert(
            [
              { user_id: user.id, role: role as any, created_at: new Date().toISOString() },
            ],
            { onConflict: "user_id" }
          );
      } catch (err) {
        console.error("Failed to sync user role:", err);
      }
    };

    upsertRole();
  }, [isLoaded, user]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Admin routes */}
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/parents" element={<Parents />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/academic-years" element={<AcademicYears />} />
            <Route path="/timetable" element={<AdminTimetable />} />
            <Route path="/admin/results" element={<ResultsManagement />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/attendance/daily" element={<DailyAttendance />} />
            <Route path="/attendance/reports" element={<AttendanceReports />} />
            <Route path="/fees/structure" element={<FeeStructure />} />
            <Route path="/fees/payments" element={<Payments />} />
            <Route path="/fees/reports" element={<FeeReports />} />
            <Route path="/admin/bulk-create-users" element={<BulkCreateUsers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />

            {/* Teacher routes */}
            <Route path="/teacher/scores" element={<ScoreEntry />} />
            <Route path="/teacher/submissions" element={<Submissions />} />
            <Route path="/my-classes" element={<MyClasses />} />
            <Route path="/my-timetable" element={<MyTimetable />} />
            <Route path="/attendance/mark" element={<MarkAttendance />} />
            <Route path="/attendance/history" element={<AttendanceHistory />} />
            <Route path="/assignments" element={<TeacherAssignments />} />
            <Route path="/exams" element={<Exams />} />

            {/* Student routes */}
            <Route path="/student/results" element={<MyResults />} />
            <Route path="/student/report-card" element={<ReportCard />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/timetable" element={<StudentTimetable />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/attendance" element={<StudentAttendance />} />

            {/* Parent routes */}
            <Route path="/children" element={<Children />} />
            <Route path="/children/attendance" element={<ChildrenAttendance />} />
            <Route path="/children/grades" element={<ChildrenGrades />} />
            <Route path="/fees/status" element={<FeeStatus />} />
            <Route path="/fees/history" element={<PaymentHistory />} />

            {/* Shared routes */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Catch-all route must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;