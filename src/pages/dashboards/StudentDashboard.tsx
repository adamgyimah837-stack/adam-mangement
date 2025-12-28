import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  BookOpen,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  GraduationCap,
  ClipboardList,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StudentOnboarding from "@/pages/student/Onboarding";

const StudentDashboard = () => {
  const { user } = useUser();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [feePaid, setFeePaid] = useState<number>(0);
  const [feeOwing, setFeeOwing] = useState<number>(0);

  useEffect(() => {
    const checkStudent = async () => {
      try {
        const { data } = await supabase.from("students").select("id, class_id").eq("user_id", user?.id).single();
        if (!data) {
          setNeedsOnboarding(true);
        } else {
          // fetch fee summary
          fetchStudentFees(data.id, data.class_id);
        }
      } catch (err) {
        setNeedsOnboarding(true);
      }
    };
    if (user) checkStudent();
  }, [user]);

  const fetchStudentFees = async (studentId: string, classId?: string | null) => {
    try {
      const { data: payments } = await supabase.from('payments').select('amount').eq('student_id', studentId);
      const totalPaid = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      setFeePaid(totalPaid);

      let totalDue = 0;
      if (classId) {
        const { data: mappings } = await supabase.from('fee_category_classes').select('fee_categories(amount)').eq('class_id', classId);
        if (mappings && mappings.length > 0) {
          totalDue = mappings.reduce((s: number, m: any) => s + (m.fee_categories?.amount || 0), 0);
        }
      }
      if (totalDue === 0) {
        const { data: cats } = await supabase.from('fee_categories').select('amount');
        totalDue = (cats || []).reduce((s: number, c: any) => s + (c.amount || 0), 0);
      }
      setFeeOwing(Math.max(0, totalDue - totalPaid));
    } catch (err) {
      console.error('Error fetching student fees', err);
    }
  };

  const stats = [
    { title: "My Subjects", value: "8", icon: BookOpen, color: "bg-blue-500" },
    { title: "Attendance", value: "92%", icon: Calendar, color: "bg-green-500" },
    { title: "GPA", value: "3.8", icon: Award, color: "bg-purple-500" },
    { title: "Fees", value: `Paid: ₦${feePaid?.toLocaleString?.() ?? 0} • Owing: ₦${feeOwing?.toLocaleString?.() ?? 0}`, icon: FileText, color: "bg-orange-500" },
  ];

  const quickActions = [
    { title: "My Schedule", icon: Clock, href: "/schedule" },
    { title: "Assignments", icon: FileText, href: "/assignments" },
    { title: "Grades", icon: TrendingUp, href: "/grades" },
    { title: "Attendance", icon: Calendar, href: "/attendance" },
  ];

  const todayClasses = [
    { time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Johnson", room: "Room 201" },
    { time: "9:30 AM", subject: "English", teacher: "Ms. Smith", room: "Room 102" },
    { time: "11:00 AM", subject: "Physics", teacher: "Dr. Brown", room: "Lab 3" },
    { time: "2:00 PM", subject: "History", teacher: "Mrs. Davis", room: "Room 305" },
  ];

  const upcomingAssignments = [
    { subject: "Mathematics", title: "Chapter 5 Problems", dueDate: "Tomorrow", priority: "high" },
    { subject: "English", title: "Essay - Climate Change", dueDate: "In 3 days", priority: "medium" },
    { subject: "Physics", title: "Lab Report", dueDate: "In 5 days", priority: "low" },
  ];

  if (needsOnboarding) {
    return (
      <DashboardLayout>
        <StudentOnboarding onComplete={() => setNeedsOnboarding(false)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              Student • Grade 10A
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Hello, {user?.firstName || "Student"}!
          </h2>
          <p className="text-muted-foreground">
            You have 4 classes and 3 assignments due this week.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Jump to your most used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col items-center gap-3 py-6 hover:bg-primary/5 hover:border-primary/50 transition-all"
                  onClick={() => toast.info(`${action.title} - Coming Soon!`)}
                >
                  <action.icon className="w-8 h-8" />
                  <span className="text-center text-sm">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Today's Classes</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayClasses.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center min-w-[70px]">
                      <p className="text-sm font-bold text-primary">{item.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.teacher} • {item.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Don't miss your deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAssignments.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.priority === "high"
                        ? "bg-red-50 border-red-200"
                        : item.priority === "medium"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <ClipboardList
                      className={`w-5 h-5 mt-0.5 ${
                        item.priority === "high"
                          ? "text-red-500"
                          : item.priority === "medium"
                          ? "text-orange-500"
                          : "text-green-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.subject} • Due: {item.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
