import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ScoreEntry {
  id: string;
  student_name: string;
  class_name: string;
  class_score: number;
  quiz_score: number;
  exam_score: number;
  attendance_score: number;
  total_score: number;
  grade: string;
  is_submitted: boolean;
}

interface StudentClass {
  id: string;
  class_name: string;
}

const Gradebook = () => {
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    class_score: "",
    quiz_score: "",
    exam_score: "",
    attendance_score: "",
  });

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
          .select(`
            id,
            classes(id, class_name)
          `)
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

  const fetchClassScores = async (classId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_scores")
        .select(`
          id,
          class_score,
          quiz_score,
          exam_score,
          attendance_score,
          total_score,
          grade,
          is_submitted,
          students ( profiles ( full_name ) )
        `)
        .eq("class_id", classId);

      if (error) throw error;

      const formattedScores = (data || []).map((score: any) => ({
        id: score.id,
        student_name: score.students?.profiles?.full_name || "Unknown",
        class_name: selectedClass,
        class_score: score.class_score || 0,
        quiz_score: score.quiz_score || 0,
        exam_score: score.exam_score || 0,
        attendance_score: score.attendance_score || 0,
        total_score: score.total_score || 0,
        grade: score.grade || "N/A",
        is_submitted: score.is_submitted || false,
      }));

      setScores(formattedScores);
    } catch (error) {
      console.error("Error fetching scores:", error);
      toast.error("Failed to load scores");
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    fetchClassScores(classId);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const calculateGrade = (total: number): string => {
    if (total >= 90) return "A";
    if (total >= 80) return "B";
    if (total >= 70) return "C";
    if (total >= 60) return "D";
    return "F";
  };

  const handleUpdateScore = async (scoreId: string) => {
    if (
      !formData.class_score &&
      !formData.quiz_score &&
      !formData.exam_score &&
      !formData.attendance_score
    ) {
      toast.error("Please enter at least one score");
      return;
    }

    setSaving(true);
    try {
      const total =
        parseFloat(formData.class_score || "0") +
        parseFloat(formData.quiz_score || "0") +
        parseFloat(formData.exam_score || "0") +
        parseFloat(formData.attendance_score || "0");

      const { error } = await supabase
        .from("student_scores")
        .update({
          class_score: formData.class_score ? parseFloat(formData.class_score) : 0,
          quiz_score: formData.quiz_score ? parseFloat(formData.quiz_score) : 0,
          exam_score: formData.exam_score ? parseFloat(formData.exam_score) : 0,
          attendance_score: formData.attendance_score
            ? parseFloat(formData.attendance_score)
            : 0,
          grade: calculateGrade(total),
        })
        .eq("id", scoreId);

      if (error) throw error;

      toast.success("Score updated successfully");
      setDialogOpen(false);
      setFormData({
        class_score: "",
        quiz_score: "",
        exam_score: "",
        attendance_score: "",
      });
      if (selectedClass) {
        fetchClassScores(selectedClass);
      }
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }, { label: "Gradebook" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gradebook</h1>
          <p className="text-muted-foreground">
            Manage student scores and grades
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Classes
            </CardTitle>
            <CardDescription>
              Select a class to view and manage student scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class_select">Select Class</Label>
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

              {selectedClass && (
                <>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : scores.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="text-center">Class</TableHead>
                            <TableHead className="text-center">Quiz</TableHead>
                            <TableHead className="text-center">Exam</TableHead>
                            <TableHead className="text-center">Attendance</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scores.map((score) => (
                            <TableRow key={score.id}>
                              <TableCell className="font-medium">
                                {score.student_name}
                              </TableCell>
                              <TableCell className="text-center">
                                {score.class_score}
                              </TableCell>
                              <TableCell className="text-center">
                                {score.quiz_score}
                              </TableCell>
                              <TableCell className="text-center">
                                {score.exam_score}
                              </TableCell>
                              <TableCell className="text-center">
                                {score.attendance_score}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {score.total_score}
                              </TableCell>
                              <TableCell className="text-center">
                                {score.grade}
                              </TableCell>
                              <TableCell>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Save className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Update Score</DialogTitle>
                                      <DialogDescription>
                                        Update scores for {score.student_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="class_score">
                                          Class Score
                                        </Label>
                                        <Input
                                          id="class_score"
                                          type="number"
                                          placeholder="0"
                                          value={formData.class_score}
                                          onChange={(e) =>
                                            handleInputChange(e, "class_score")
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="quiz_score">
                                          Quiz Score
                                        </Label>
                                        <Input
                                          id="quiz_score"
                                          type="number"
                                          placeholder="0"
                                          value={formData.quiz_score}
                                          onChange={(e) =>
                                            handleInputChange(e, "quiz_score")
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="exam_score">
                                          Exam Score
                                        </Label>
                                        <Input
                                          id="exam_score"
                                          type="number"
                                          placeholder="0"
                                          value={formData.exam_score}
                                          onChange={(e) =>
                                            handleInputChange(e, "exam_score")
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="attendance_score">
                                          Attendance Score
                                        </Label>
                                        <Input
                                          id="attendance_score"
                                          type="number"
                                          placeholder="0"
                                          value={formData.attendance_score}
                                          onChange={(e) =>
                                            handleInputChange(e, "attendance_score")
                                          }
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => handleUpdateScore(score.id)}
                                        disabled={saving}
                                      >
                                        {saving ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                          </>
                                        ) : (
                                          "Save Score"
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No students in this class yet
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Gradebook;
