import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Award, TrendingUp, BookOpen, Loader2 } from "lucide-react";

interface ResultScore {
  id: string;
  subject_name: string;
  class_score: number;
  quiz_score: number;
  exam_score: number;
  attendance_score: number;
  total_score: number;
  grade: string;
}

interface ExamTerm {
  id: string;
  term_name: string;
}

const MyResults = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [examTerms, setExamTerms] = useState<ExamTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [results, setResults] = useState<ResultScore[]>([]);

  useEffect(() => {
    fetchExamTerms();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      fetchResults();
    }
  }, [selectedTerm, user?.id]);

  const fetchExamTerms = async () => {
    try {
      try {
        const { data, error } = await supabase
          .from("exam_terms")
          .select("id, term_name")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          setExamTerms(data);
          if (data.length > 0) setSelectedTerm(data[0].id);
          return;
        }
      } catch (err: any) {
        const msg = (err?.message || "").toString();
        if (msg.includes("does not exist") || msg.includes("column \"is_published\"")) {
          // Fallback: fetch all terms if column missing
          const { data: fallback, error: fbErr } = await supabase.from("exam_terms").select("id, term_name").order("created_at", { ascending: false });
          if (fbErr) throw fbErr;
          if (fallback) {
            setExamTerms(fallback);
            if (fallback.length > 0) setSelectedTerm(fallback[0].id);
          }
          return;
        }
        throw err;
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
    }
  };

  const fetchResults = async () => {
    if (!user?.id || !selectedTerm) return;

    setLoading(true);
    try {
      // Get student ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData) {
        toast.error("Student profile not found");
        return;
      }

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
          subjects!student_scores_subject_id_fkey(subject_name)
        `)
        .eq("student_id", studentData.id)
        .eq("exam_term_id", selectedTerm);

      if (error) throw error;

      const scores: ResultScore[] = (data || []).map((score: any) => ({
        id: score.id,
        subject_name: score.subjects?.subject_name || "Unknown",
        class_score: score.class_score,
        quiz_score: score.quiz_score,
        exam_score: score.exam_score,
        attendance_score: score.attendance_score,
        total_score: score.total_score,
        grade: score.grade,
      }));

      setResults(scores);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (results.length === 0) return { average: 0, highest: 0, subjects: 0 };
    const total = results.reduce((sum, r) => sum + r.total_score, 0);
    const average = total / results.length;
    const highest = Math.max(...results.map((r) => r.total_score));
    return { average: average.toFixed(1), highest, subjects: results.length };
  };

  const stats = calculateStats();

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Results" }]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">My Results</h2>
          <p className="text-muted-foreground">
            View your academic performance and grades.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.average}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highest}%</p>
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.subjects}</p>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Term Selector & Results */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Academic Results</CardTitle>
                <CardDescription>Your scores for each subject</CardDescription>
              </div>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {examTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.term_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : examTerms.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No published results available yet.
              </p>
            ) : results.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No results found for this term.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Class (30)</TableHead>
                    <TableHead className="text-center">Quiz (20)</TableHead>
                    <TableHead className="text-center">Exam (40)</TableHead>
                    <TableHead className="text-center">Attendance (10)</TableHead>
                    <TableHead className="text-center">Total (100)</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.subject_name}</TableCell>
                      <TableCell className="text-center">{result.class_score}</TableCell>
                      <TableCell className="text-center">{result.quiz_score}</TableCell>
                      <TableCell className="text-center">{result.exam_score}</TableCell>
                      <TableCell className="text-center">{result.attendance_score}</TableCell>
                      <TableCell className="text-center font-bold">{result.total_score}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={result.grade === "F" ? "destructive" : "default"}
                          className={
                            result.grade.startsWith("A") 
                              ? "bg-green-500 hover:bg-green-600" 
                              : result.grade.startsWith("B")
                              ? "bg-blue-500 hover:bg-blue-600"
                              : result.grade === "C"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : result.grade === "D"
                              ? "bg-orange-500 hover:bg-orange-600"
                              : ""
                          }
                        >
                          {result.grade}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyResults;
