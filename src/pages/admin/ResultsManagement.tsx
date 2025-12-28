import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, Plus, Loader2, Eye } from "lucide-react";

interface ExamTerm {
  id: string;
  term_name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
}

interface SubmittedScore {
  id: string;
  student_name: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  class_score: number;
  quiz_score: number;
  exam_score: number;
  attendance_score: number;
  total_score: number;
  grade: string;
}

const ResultsManagement = () => {
  const [examTerms, setExamTerms] = useState<ExamTerm[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; year_name: string }[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm | null>(null);
  const [submittedScores, setSubmittedScores] = useState<SubmittedScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // New term form
  const [newTermName, setNewTermName] = useState("");
  const [newTermYear, setNewTermYear] = useState("");
  const [newTermStart, setNewTermStart] = useState("");
  const [newTermEnd, setNewTermEnd] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [termsRes, yearsRes] = await Promise.all([
        supabase.from("exam_terms").select("*").order("created_at", { ascending: false }),
        supabase.from("academic_years").select("id, year_name")
      ]);

      if (termsRes.data) setExamTerms(termsRes.data);
      if (yearsRes.data) setAcademicYears(yearsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const createExamTerm = async () => {
    if (!newTermName || !newTermYear) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("exam_terms").insert({
        term_name: newTermName,
        academic_year_id: newTermYear,
        start_date: newTermStart || null,
        end_date: newTermEnd || null,
      });

      if (error) throw error;

      toast.success("Exam term created successfully");
      setDialogOpen(false);
      setNewTermName("");
      setNewTermYear("");
      setNewTermStart("");
      setNewTermEnd("");
      fetchData();
    } catch (error) {
      console.error("Error creating term:", error);
      toast.error("Failed to create exam term");
    }
  };

  const loadSubmittedScores = async (term: ExamTerm) => {
    setSelectedTerm(term);
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
          students ( profiles ( full_name ) ),
          subjects ( subject_name ),
          classes ( class_name ),
          teachers ( profiles ( full_name ) )
        `)
        .eq("exam_term_id", term.id)
        .eq("is_submitted", true);

      if (error) throw error;

      const scores: SubmittedScore[] = (data || []).map((score: any) => ({
        id: score.id,
        student_name: score.students?.profiles?.full_name || "Unknown",
        subject_name: score.subjects?.subject_name || "Unknown",
        class_name: score.classes?.class_name || "Unknown",
        teacher_name: score.teachers?.profiles?.full_name || "Unknown",
        class_score: score.class_score,
        quiz_score: score.quiz_score,
        exam_score: score.exam_score,
        attendance_score: score.attendance_score,
        total_score: score.total_score,
        grade: score.grade,
      }));

      setSubmittedScores(scores);
    } catch (error) {
      console.error("Error loading scores:", error);
      const message = (error as any)?.message || (error as any)?.details || "Failed to load submitted scores";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const publishResults = async () => {
    if (!selectedTerm) return;

    setPublishing(true);
    try {
      const { error } = await supabase
        .from("exam_terms")
        .update({ is_published: true })
        .eq("id", selectedTerm.id);

      if (error) throw error;

      toast.success("Results published successfully! Students can now view their scores.");
      setSelectedTerm({ ...selectedTerm, is_published: true });
      fetchData();
    } catch (error) {
      console.error("Error publishing:", error);
      const msg = (error as any)?.message || (error as any)?.details || "Failed to publish results";
      if (msg.includes("does not exist") || msg.includes("column \"is_published\"")) {
        toast.error("Database column `exam_terms.is_published` is missing. Run migrations to add it.");
      } else {
        toast.error(msg);
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Results Management" }]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Results Management</h2>
            <p className="text-muted-foreground">
              Create exam terms, review submitted scores, and publish results.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Exam Term
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam Term</DialogTitle>
                <DialogDescription>
                  Create a new exam term for teachers to submit scores.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Term Name *</Label>
                  <Input
                    placeholder="e.g., First Term 2024"
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select value={newTermYear} onValueChange={setNewTermYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.year_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newTermStart}
                      onChange={(e) => setNewTermStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newTermEnd}
                      onChange={(e) => setNewTermEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createExamTerm}>Create Term</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="terms" className="space-y-4">
          <TabsList>
            <TabsTrigger value="terms">Exam Terms</TabsTrigger>
            <TabsTrigger value="scores">Review Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="terms">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examTerms.map((term) => (
                <Card key={term.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{term.term_name}</CardTitle>
                      <Badge variant={term.is_published ? "default" : "secondary"}>
                        {term.is_published ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Published</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                    </div>
                    <CardDescription>
                      {term.start_date && term.end_date
                        ? `${new Date(term.start_date).toLocaleDateString()} - ${new Date(term.end_date).toLocaleDateString()}`
                        : "Dates not set"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => loadSubmittedScores(term)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Submissions
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scores">
            {selectedTerm ? (
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedTerm.term_name} - Submitted Scores</CardTitle>
                    <CardDescription>
                      {submittedScores.length} scores submitted by teachers
                    </CardDescription>
                  </div>
                  {!selectedTerm.is_published && submittedScores.length > 0 && (
                    <Button onClick={publishResults} disabled={publishing}>
                      {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Publish Results
                    </Button>
                  )}
                  {selectedTerm.is_published && (
                    <Badge variant="default" className="text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" /> Published
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : submittedScores.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-center">Class</TableHead>
                          <TableHead className="text-center">Quiz</TableHead>
                          <TableHead className="text-center">Exam</TableHead>
                          <TableHead className="text-center">Attend</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submittedScores.map((score) => (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium">{score.student_name}</TableCell>
                            <TableCell>{score.class_name}</TableCell>
                            <TableCell>{score.subject_name}</TableCell>
                            <TableCell>{score.teacher_name}</TableCell>
                            <TableCell className="text-center">{score.class_score}</TableCell>
                            <TableCell className="text-center">{score.quiz_score}</TableCell>
                            <TableCell className="text-center">{score.exam_score}</TableCell>
                            <TableCell className="text-center">{score.attendance_score}</TableCell>
                            <TableCell className="text-center font-bold">{score.total_score}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={score.grade === "F" ? "destructive" : "default"}>
                                {score.grade}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No scores submitted yet for this term.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select an exam term from the "Exam Terms" tab to view submitted scores.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ResultsManagement;
