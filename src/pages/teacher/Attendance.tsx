import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  student_id: string;
  attendance_status?: string;
}

interface ClassData {
  id: string;
  class_name: string;
}

const Attendance = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  const fetchTeacherClasses = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", authUser.user.id)
        .single();

      if (teacherData) {
        const { data, error } = await supabase
          .from("teacher_assignments")
          .select(
            `
            classes:class_id(id, class_name)
          `
          )
          .eq("teacher_id", teacherData.id);

        if (error) throw error;

        const uniqueClasses = [
          ...new Map(
            data?.map((item: any) => [
              item.classes.id,
              item.classes,
            ]) || []
          ).values(),
        ];
        // If teacher has no explicit assignments, fall back to all classes so admin additions are visible
        if (uniqueClasses.length > 0) {
          setClasses(uniqueClasses);
        } else {
          const { data: allClasses } = await supabase.from("classes").select("id, class_name").order("grade_level", { ascending: true });
          setClasses(allClasses || []);
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load your classes");
    }
  };

  const fetchClassStudents = async (classId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select(
          `
          id,
          student_id,
          profiles(full_name)
        `
        )
        .eq("class_id", classId);

      if (error) throw error;

      const formattedStudents = (data || []).map((student: any) => ({
        id: student.id,
        name: student.profiles?.full_name || "Unknown",
        student_id: student.student_id,
      }));

      setStudents(formattedStudents);

      // Fetch existing attendance for selected date
      const { data: attendanceData } = await supabase
        .from("attendance" as any)
        .select("student_id, status")
        .eq("class_id", classId)
        .eq("date", selectedDate);

      const attendanceMap: { [key: string]: string } = {};
      attendanceData?.forEach((record: any) => {
        attendanceMap[record.student_id] = record.status;
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    fetchClassStudents(classId);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || Object.keys(attendance).length === 0) {
      toast.error("Please select a class and mark attendance");
      return;
    }

    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        date: selectedDate,
        status,
      }));

      for (const record of records) {
        await supabase.from("attendance").upsert([record], {
          onConflict: "student_id,class_id,date",
        });
      }

      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }, { label: "Attendance" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground">
            Mark student attendance for your classes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Marking
            </CardTitle>
            <CardDescription>
              Select a class and date to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Class</label>
                <Select value={selectedClass} onValueChange={handleClassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
            </div>

            {selectedClass && (
              <>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                {student.student_id}
                              </TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    toggleAttendance(student.id)
                                  }
                                  className={
                                    attendance[student.id] === "present"
                                      ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                      : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                                  }
                                >
                                  {attendance[student.id] === "present" ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Present
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Absent
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleSaveAttendance}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Attendance"
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    No students in this class
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
