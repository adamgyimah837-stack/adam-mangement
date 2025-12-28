import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Bell,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Child {
  id: string;
  name: string;
  grade: string;
  attendance: string;
  gpa: string;
  class_id?: string | null;
}

interface Result {
  subject: string;
  score: number;
  grade: string;
  teacher: string;
}

interface Fee {
  id: string;
  student_name: string;
  amount: number;
  payment_date: string;
  status: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
  percentage: number;
}

const ParentDashboard = () => {
  const { user } = useUser();
  const [children, setChildren] = useState<Child[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [amountOwing, setAmountOwing] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentData();
  }, [user?.id]);

  const fetchParentData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch children of the parent
      const { data: childrenData } = await supabase
        .from("students")
        .select(`
          id,
          profiles(full_name),
          classes(id, class_name, grade_level)
        `)
        .eq("parent_user_id", user.id);

      if (childrenData) {
        const formattedChildren: Child[] = childrenData.map((child: any) => ({
          id: child.id,
          name: child.profiles?.full_name || "Unknown",
          grade: child.classes?.class_name || "Not Assigned",
          attendance: "94%",
          gpa: "3.9",
          // include class id for fee calc
          class_id: child.classes?.id || null,
        }));
        setChildren(formattedChildren);

        // Fetch results for first child
        if (formattedChildren.length > 0) {
          await fetchResults(formattedChildren[0].id);
          await fetchFees(formattedChildren[0].id, formattedChildren[0].class_id);
          await fetchAttendance(formattedChildren[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching parent data:", error);
      toast.error("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (studentId: string) => {
    try {
      const { data } = await supabase
        .from("student_scores")
        .select(`
          subject_id,
          grade,
          total_score,
          subjects(subject_name),
          teachers ( profiles ( full_name ) )
        `)
        .eq("student_id", studentId)
        .eq("exam_term_id", (await getCurrentExamTerm()).id);

      if (data) {
        const formattedResults = data.map((result: any) => ({
          subject: result.subjects?.subject_name || "Unknown",
          score: result.total_score || 0,
          grade: result.grade || "N/A",
          teacher: result.teachers?.profiles?.full_name || "Unknown",
        }));
        setResults(formattedResults);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const fetchFees = async (studentId: string, classId?: string | null) => {
    try {
      const { data } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_date,
          status,
          students ( profiles ( full_name ) )
        `)
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false })
        .limit(5);

      if (data) {
        const formattedFees = data.map((fee: any) => ({
          id: fee.id,
          student_name: fee.students?.profiles?.full_name || "Unknown",
          amount: fee.amount,
          payment_date: new Date(fee.payment_date).toLocaleDateString(),
          status: fee.status || "pending",
        }));
        setFees(formattedFees);

        // compute totals
        const { data: allPayments } = await supabase.from("payments").select("amount").eq("student_id", studentId);
        const totalPaid = (allPayments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
        setAmountPaid(totalPaid);

        // compute total due from fee categories mapped to class (fallback to all categories)
        let totalDue = 0;
        if (classId) {
          const { data: mappings } = await supabase.from("fee_category_classes").select("fee_categories(amount)").eq("class_id", classId);
          if (mappings && mappings.length > 0) {
            totalDue = mappings.reduce((s: number, m: any) => s + (m.fee_categories?.amount || 0), 0);
          }
        }
        if (totalDue === 0) {
          const { data: cats } = await supabase.from("fee_categories").select("amount");
          totalDue = (cats || []).reduce((s: number, c: any) => s + (c.amount || 0), 0);
        }

        setAmountOwing(Math.max(0, totalDue - totalPaid));
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
    }
  };

  const fetchAttendance = async (studentId: string) => {
    try {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(30);

      if (data) {
        const groupedByMonth: { [key: string]: AttendanceRecord } = {};
        data.forEach((record: any) => {
          const month = new Date(record.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          });
          if (!groupedByMonth[month]) {
            groupedByMonth[month] = {
              date: month,
              status: record.status,
              percentage: 0,
            };
          }
        });

        setAttendance(Object.values(groupedByMonth).slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const getCurrentExamTerm = async () => {
    try {
      try {
        const { data } = await supabase
          .from("exam_terms")
          .select("id")
          .eq("is_published", true)
          .single();
        return data || { id: "" };
      } catch (err: any) {
        const msg = (err?.message || "").toString();
        if (msg.includes("does not exist") || msg.includes("column \"is_published\"")) {
          const { data } = await supabase.from("exam_terms").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
          return data || { id: "" };
        }
        throw err;
      }
    } catch (error) {
      console.error("Error getting current exam term:", error);
      return { id: "" };
    }
  };

  const quickActions = [
    { title: "View Grades", icon: TrendingUp },
    { title: "Attendance Records", icon: Calendar },
    { title: "Fee Payment", icon: DollarSign },
    { title: "Contact Teacher", icon: MessageSquare },
  ];

  const recentUpdates = [
    { type: "grade", message: "Child received A in Math Quiz", time: "2 hours ago" },
    { type: "attendance", message: "Child marked present", time: "Today" },
    { type: "fee", message: "Tuition fee due in 5 days", time: "Reminder" },
    {
      type: "event",
      message: "Parent-Teacher Meeting scheduled",
      time: "Tomorrow 2PM",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
              Parent/Guardian
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user?.firstName || "Parent"}!
          </h2>
          <p className="text-muted-foreground">
            Stay updated with your children's academic progress.
          </p>
        </div>

        {/* Children Overview */}
        {children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {children.map((child, index) => (
              <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <CardDescription>{child.grade}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{child.attendance}</p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{child.gpa}</p>
                      <p className="text-xs text-muted-foreground">GPA</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">₦{amountPaid?.toLocaleString?.() ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Paid • Owing ₦{amountOwing?.toLocaleString?.() ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs for Results, Fees, and Attendance */}
        <Card className="shadow-md mb-8">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="w-full border-b rounded-none">
              <TabsTrigger value="results" className="flex-1">
                Academic Results
              </TabsTrigger>
              <TabsTrigger value="fees" className="flex-1">
                Fee Payments
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex-1">
                Attendance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <CardContent className="pt-6">
                {results.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Teacher</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {result.subject}
                          </TableCell>
                          <TableCell>{result.score}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                result.grade === "F"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.teacher}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No results available yet
                  </p>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="fees">
              <CardContent className="pt-6">
                {fees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">
                            {fee.student_name}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₦{fee.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{fee.payment_date}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                fee.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {fee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No fee payments recorded yet
                  </p>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="attendance">
              <CardContent className="pt-6">
                {attendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Attendance Status</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {record.date}
                          </TableCell>
                          <TableCell className="capitalize">
                            {record.status}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No attendance records available
                  </p>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common parent tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto flex-col items-center gap-3 py-6 hover:bg-primary/5 hover:border-primary/50 transition-all"
                >
                  <action.icon className="w-8 h-8" />
                  <span className="text-center text-sm">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Latest notifications about your children</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUpdates.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{item.message}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>School calendar events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Parent-Teacher Meeting
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tomorrow, 2:00 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Mid-term Examinations
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Starting next week
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <DollarSign className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Fee Payment Deadline</p>
                    <p className="text-xs text-muted-foreground">In 5 days</p>
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

export default ParentDashboard;
