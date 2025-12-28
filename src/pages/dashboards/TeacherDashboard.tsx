import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  Clock,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

const TeacherDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const stats = [
    { title: "My Classes", value: "4", icon: BookOpen, color: "bg-blue-500" },
    { title: "Total Students", value: "128", icon: Users, color: "bg-green-500" },
    { title: "Pending Assignments", value: "12", icon: ClipboardCheck, color: "bg-purple-500" },
    { title: "Today's Classes", value: "3", icon: Clock, color: "bg-orange-500" },
  ];

  const quickActions = [
    { title: "Mark Attendance", icon: Calendar, href: "/attendance/mark" },
    { title: "My Classes", icon: BookOpen, href: "/my-classes" },
    { title: "Gradebook", icon: ClipboardCheck, href: "/teacher/scores" },
    { title: "Create Assignment", icon: FileText, href: "/assignments" },
  ];

  const todaySchedule = [
    { time: "8:00 AM", subject: "Mathematics", class: "Grade 10A", room: "Room 201" },
    { time: "10:00 AM", subject: "Mathematics", class: "Grade 9B", room: "Room 105" },
    { time: "2:00 PM", subject: "Advanced Algebra", class: "Grade 11A", room: "Room 301" },
  ];

  const handleQuickAction = (href: string, title: string) => {
    if (href.startsWith("/")) {
      navigate(href);
    } else {
      toast.info(`${title} - Feature coming soon!`);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
              Teacher
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Good morning, {user?.firstName || "Teacher"}!
          </h2>
          <p className="text-muted-foreground">
            You have 3 classes scheduled for today.
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common teaching tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col items-center gap-3 py-6 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => handleQuickAction(action.href, action.title)}
                >
                  <action.icon className="w-8 h-8" />
                  <span className="text-center text-sm">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule & Pending Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center min-w-[70px]">
                      <p className="text-sm font-bold text-primary">{item.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.class} • {item.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <ClipboardCheck className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Grade Math Quiz - Grade 10A</p>
                    <p className="text-xs text-muted-foreground">Due in 2 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Submit attendance - Grade 9B</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <FileText className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Prepare lesson plan - Week 12</p>
                    <p className="text-xs text-muted-foreground">Due in 5 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
