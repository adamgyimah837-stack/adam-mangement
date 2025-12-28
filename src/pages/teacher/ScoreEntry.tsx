import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save, Send, Loader2 } from "lucide-react";

interface StudentScore {
  id?: string;
  student_id: string;
  student_name: string;
  class_score: number;
  quiz_score: number;
  exam_score: number;
  attendance_score: number;
  total_score?: number;
  grade?: string;
  is_submitted: boolean;
}

const ScoreEntry = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; subject_name: string }[]>([]);
  const [examTerms, setExamTerms] = useState<{ id: string; term_name: string }[]>([]);
  const [students, setStudents] = useState<StudentScore[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        supabase.from("classes").select("id, class_name"),
        supabase.from("subjects").select("id, subject_name"),
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);

      // Fetch exam terms separately so we can handle missing `is_published` column
      try {
        const termsRes = await supabase.from("exam_terms").select("id, term_name").neq("is_published", true);
        if (termsRes.error) throw termsRes.error;
        if (termsRes.data) setExamTerms(termsRes.data);
      } catch (err: any) {
        // If DB doesn't have the column, retry without filter
        const msg = (err?.message || "").toString();
        if (msg.includes("does not exist") || msg.includes("column \"is_published\"")) {
          const fallback = await supabase.from("exam_terms").select("id, term_name");
          if (!fallback.error && fallback.data) setExamTerms(fallback.data);
          else if (fallback.error) console.error("exam_terms fallback error:", fallback.error);
        } else {
          console.error("exam_terms fetch error:", err);
          toast.error((err as any)?.message || "Failed to fetch exam terms");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching dropdown data");
    }
  };

  const loadStudents = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
      toast.error("Please select class, subject, and term");
      return;
    }

    setLoading(true);
    try {
      // Get students in the selected class (fetch user_id, map to profiles separately)
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`id, user_id`)
        .eq("class_id", selectedClass);

      if (studentsError) throw studentsError;

      // Fetch profile names for the student user_ids
      const userIds = (studentsData || []).map((s: any) => s.user_id).filter(Boolean);
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        if (profilesError) console.error("profiles fetch error:", profilesError);
        (profilesData || []).forEach((p: any) => {
          profilesMap[p.id] = p.full_name;
        });
      }

      // Get existing scores for this class/subject/term
      const { data: scoresData } = await supabase
        .from("student_scores")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("subject_id", selectedSubject)
        .eq("exam_term_id", selectedTerm);

      const studentScores: StudentScore[] = (studentsData || []).map((student: any) => {
        const existingScore = scoresData?.find((s) => s.student_id === student.id);
        return {
          id: existingScore?.id,
          student_id: student.id,
          student_name: profilesMap[student.user_id] || "Unknown",
          class_score: existingScore?.class_score || 0,
          quiz_score: existingScore?.quiz_score || 0,
          exam_score: existingScore?.exam_score || 0,
          attendance_score: existingScore?.attendance_score || 0,
          total_score: existingScore?.total_score || 0,
          grade: existingScore?.grade || "",
          is_submitted: existingScore?.is_submitted || false,
        };
      });

      setStudents(studentScores);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (studentId: string, field: keyof StudentScore, value: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId
          ? { ...s, [field]: value }
          : s
      )
    );
  };

  const calculateGrade = (total: number): string => {
    if (total >= 90) return "A+";
    if (total >= 80) return "A";
    if (total >= 70) return "B+";
    if (total >= 60) return "B";
    if (total >= 50) return "C";
    if (total >= 40) return "D";
    return "F";
  };

  const saveScores = async (submit: boolean = false) => {
    if (students.length === 0) {
      toast.error("No students to save");
      return;
    }

    setSaving(true);
    try {
      // Get teacher ID
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!teacherData) {
        toast.error("Teacher profile not found");
        return;
      }

      for (const student of students) {
        if (student.is_submitted && submit) continue;

        const total = student.class_score + student.quiz_score + student.exam_score + student.attendance_score;
        const grade = calculateGrade(total);

        const scoreData = {
          student_id: student.student_id,
          subject_id: selectedSubject,
          class_id: selectedClass,
          exam_term_id: selectedTerm,
          teacher_id: teacherData.id,
          class_score: student.class_score,
          quiz_score: student.quiz_score,
          exam_score: student.exam_score,
          attendance_score: student.attendance_score,
          grade,
          is_submitted: submit,
        };

        if (student.id) {
          await supabase
            .from("student_scores")
            .update(scoreData)
            .eq("id", student.id);
        } else {
          await supabase
            .from("student_scores")
            .insert(scoreData);
        }
      }

      toast.success(submit ? "Scores submitted successfully!" : "Scores saved as draft");
      loadStudents();
    } catch (error) {
      console.error("Error saving scores:", error);
      toast.error("Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Score Entry" }]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Enter Student Scores</h2>
          <p className="text-muted-foreground">
            Enter class scores, quiz scores, exam scores, and attendance for your students.
          </p>
        </div>

        {/* Filters */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle>Select Class & Subject</CardTitle>
            <CardDescription>Choose the class, subject, and term to enter scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exam Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTerms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.term_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={loadStudents} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load Students
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scores Table */}
        {students.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Scores</CardTitle>
                <CardDescription>{students.length} students found</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => saveScores(false)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={() => saveScores(true)} disabled={saving}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-24">Class (30)</TableHead>
                    <TableHead className="w-24">Quiz (20)</TableHead>
                    <TableHead className="w-24">Exam (40)</TableHead>
                    <TableHead className="w-24">Attend (10)</TableHead>
                    <TableHead className="w-20">Total</TableHead>
                    <TableHead className="w-16">Grade</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const total = student.class_score + student.quiz_score + student.exam_score + student.attendance_score;
                    const grade = calculateGrade(total);
                    
                    return (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={student.class_score}
                            onChange={(e) => updateScore(student.student_id, "class_score", Number(e.target.value))}
                            disabled={student.is_submitted}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={student.quiz_score}
                            onChange={(e) => updateScore(student.student_id, "quiz_score", Number(e.target.value))}
                            disabled={student.is_submitted}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            value={student.exam_score}
                            onChange={(e) => updateScore(student.student_id, "exam_score", Number(e.target.value))}
                            disabled={student.is_submitted}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={student.attendance_score}
                            onChange={(e) => updateScore(student.student_id, "attendance_score", Number(e.target.value))}
                            disabled={student.is_submitted}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="font-bold">{total}</TableCell>
                        <TableCell>
                          <Badge variant={grade === "F" ? "destructive" : "default"}>
                            {grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.is_submitted ? "secondary" : "outline"}>
                            {student.is_submitted ? "Submitted" : "Draft"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ScoreEntry;
