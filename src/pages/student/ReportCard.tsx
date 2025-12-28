import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface StudentScore {
  id: string;
  class_score: number | null;
  quiz_score: number | null;
  exam_score: number | null;
  attendance_score: number | null;
  total_score: number | null;
  grade: string | null;
  remarks: string | null;
  subjects: { subject_name: string } | null;
  exam_terms: { term_name: string; academic_year_id: string | null } | null;
}

const ReportCard = () => {
  const { user } = useUser();
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  // Get student record
  const { data: student } = useQuery({
    queryKey: ["student-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, profiles(*), classes(*)")
        .eq("user_id", user?.id || "")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get published exam terms with scores
  const { data: publishedTerms, isLoading } = useQuery({
    queryKey: ["published-terms-with-scores", student?.id],
    queryFn: async () => {
      try {
        try {
          const { data: terms, error: termsError } = await supabase
            .from("exam_terms")
            .select("*, academic_years(*)")
            .eq("is_published", true)
            .order("created_at", { ascending: false });

          if (termsError) throw termsError;

          // Get scores for each term
          const termsWithScores = await Promise.all(
            (terms || []).map(async (term) => {
              const { data: scores } = await supabase
                .from("student_scores")
                .select("*, subjects(*)")
                .eq("student_id", student?.id || "")
                .eq("exam_term_id", term.id);

              return {
                ...term,
                scores: scores || [],
              };
            })
          );

          return termsWithScores.filter((term) => term.scores.length > 0);
        } catch (err: any) {
          const msg = (err?.message || "").toString();
          if (msg.includes("does not exist") || msg.includes("column \"is_published\"")) {
            // Fallback: fetch all terms
            const { data: terms, error: fbErr } = await supabase
              .from("exam_terms")
              .select("*, academic_years(*)")
              .order("created_at", { ascending: false });

            if (fbErr) throw fbErr;

            const termsWithScores = await Promise.all(
              (terms || []).map(async (term) => {
                const { data: scores } = await supabase
                  .from("student_scores")
                  .select("*, subjects(*)")
                  .eq("student_id", student?.id || "")
                  .eq("exam_term_id", term.id);

                return {
                  ...term,
                  scores: scores || [],
                };
              })
            );

            return termsWithScores.filter((term) => term.scores.length > 0);
          }
          throw err;
        }
      } catch (error) {
        throw error;
      }
    },
    enabled: !!student?.id,
  });

  const generatePDF = async (term: any) => {
    setGeneratingPdf(term.id);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT REPORT CARD", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(term.academic_years?.year_name || "Academic Year", pageWidth / 2, 28, { align: "center" });
      doc.text(term.term_name, pageWidth / 2, 35, { align: "center" });

      // Student Info
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Student Information", 14, 50);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const studentInfo = [
        ["Name:", student?.profiles?.full_name || "N/A"],
        ["Student ID:", student?.student_id || "N/A"],
        ["Class:", student?.classes?.class_name || "N/A"],
        ["Date Generated:", format(new Date(), "MMMM dd, yyyy")],
      ];

      let yPos = 58;
      studentInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(value, 50, yPos);
        yPos += 7;
      });

      // Scores Table
      const tableData = term.scores.map((score: any) => [
        score.subjects?.subject_name || "N/A",
        score.class_score?.toString() || "0",
        score.quiz_score?.toString() || "0",
        score.exam_score?.toString() || "0",
        score.attendance_score?.toString() || "0",
        score.total_score?.toString() || "0",
        score.grade || "N/A",
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [["Subject", "Class", "Quiz", "Exam", "Attendance", "Total", "Grade"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 25, halign: "center" },
          5: { cellWidth: 20, halign: "center" },
          6: { cellWidth: 20, halign: "center" },
        },
      });

      // Calculate overall
      const totalScores = term.scores.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0);
      const averageScore = term.scores.length > 0 ? (totalScores / term.scores.length).toFixed(2) : "0";

      const finalY = ((doc as any).lastAutoTable?.finalY ?? doc.internal.pageSize.getHeight() - 60) + 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Overall Average: ${averageScore}%`, 14, finalY);

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("This is a computer-generated report card.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

      // Save PDF
      doc.save(`Report_Card_${student?.student_id}_${term.term_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Report card downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate report card");
    } finally {
      setGeneratingPdf(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Card</h1>
            <p className="text-muted-foreground">View and download your report cards</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Report Cards</CardTitle>
            <CardDescription>Download your official report cards as PDF</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : publishedTerms && publishedTerms.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publishedTerms.map((term) => (
                  <Card key={term.id} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{term.term_name}</CardTitle>
                      <CardDescription>
                        {term.academic_years?.year_name || "Academic Year"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {term.scores.length} subject(s)
                        </span>
                        <Button
                          size="sm"
                          onClick={() => generatePDF(term)}
                          disabled={generatingPdf === term.id}
                        >
                          {generatingPdf === term.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No report cards available</h3>
                <p className="text-muted-foreground mt-1">
                  Report cards will be available after results are published
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportCard;
