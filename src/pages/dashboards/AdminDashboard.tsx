import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Users,
  UserCog,
  BookOpen,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { user } = useUser();

  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalTeachers, setTotalTeachers] = useState<number | null>(null);
  const [activeClasses, setActiveClasses] = useState<number | null>(null);
  const [attendanceRate, setAttendanceRate] = useState<string | null>(null);

  const quickActions = [
    { title: "Manage Students", icon: Users, href: "/students" },
    { title: "Manage Teachers", icon: UserCog, href: "/teachers" },
    { title: "Manage Parents", icon: Users, href: "/parents" },
    { title: "Academic Setup", icon: BookOpen, href: "/academic-years" },
    { title: "Fee Structure", icon: DollarSign, href: "/fees/structure" },
    { title: "Attendance Reports", icon: Calendar, href: "/attendance/reports" },
    { title: "User Roles", icon: Shield, href: "/roles" },
    { title: "School Settings", icon: Settings, href: "/settings" },
    { title: "Analytics", icon: BarChart3, href: "/analytics" },
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [{ count: sCount }, { count: tCount }, { count: cCount }] = await Promise.all([
          supabase.from("students").select("id", { head: true, count: "exact" }),
          supabase.from("teachers").select("id", { head: true, count: "exact" }),
          supabase.from("classes").select("id", { head: true, count: "exact" }),
        ]);

        setTotalStudents(sCount || 0);
        setTotalTeachers(tCount || 0);
        setActiveClasses(cCount || 0);

        // Simple attendance rate: percent of present records over total records today
        const today = new Date().toISOString().split("T")[0];
        const { data: presentData, error: pErr } = await supabase
          .from("attendance")
          .select("id", { head: true, count: "exact" })
          .eq("date", today)
          .eq("status", "present");
        const { data: totalData, error: tErr } = await supabase
          .from("attendance")
          .select("id", { head: true, count: "exact" })
          .eq("date", today);

        const present = presentData?.count || 0;
        const total = totalData?.count || 0;
        const rate = total > 0 ? `${((present / total) * 100).toFixed(1)}%` : "N/A";
        setAttendanceRate(rate);
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };
    loadStats();
  }, []);

  const stats = [
    { title: "Total Students", color: "bg-blue-500", icon: Users },
    { title: "Total Teachers", color: "bg-green-500", icon: UserCog },
    { title: "Active Classes", color: "bg-purple-500", icon: BookOpen },
    { title: "Attendance Rate", color: "bg-orange-500", icon: BarChart3 },
  ];

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              Administrator
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.firstName || "Admin"}!
          </h2>
          <p className="text-muted-foreground">
            Here's an overview of your school management system.
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
                <p className="text-2xl font-bold text-foreground mb-1">
                  {stat.title === "Total Students" ? (totalStudents ?? "—") : stat.title === "Total Teachers" ? (totalTeachers ?? "—") : stat.title === "Active Classes" ? (activeClasses ?? "—") : (attendanceRate ?? "—")}
                </p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>Manage all aspects of the school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col items-center gap-3 py-6 hover:bg-primary/5 hover:border-primary/50 transition-all"
                  onClick={() => navigate(action.href)}
                >
                  <action.icon className="w-8 h-8" />
                  <span className="text-center text-sm">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">New teacher registered</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-secondary" />
                  <div>
                    <p className="text-sm font-medium">Fee payment received - $2,500</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-medium">New academic year created</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                  <div className="w-2 h-2 mt-2 rounded-full bg-destructive" />
                  <div>
                    <p className="text-sm font-medium">5 pending role assignments</p>
                    <p className="text-xs text-muted-foreground">New users waiting for approval</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">System backup completed</p>
                    <p className="text-xs text-muted-foreground">Today at 3:00 AM</p>
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

export default AdminDashboard;
