import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

const Submissions = () => {
  const { user } = useUser();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["teacher-submissions", user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      
      if (!teacher) return [];

      const { data, error } = await supabase
        .from("student_scores")
        .select(`
          *,
          exam_terms:exam_term_id(term_name),
          classes:class_id(class_name),
          subjects:subject_id(subject_name)
        `)
        .eq("teacher_id", teacher.id)
        .eq("is_submitted", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-muted-foreground">View your submitted score entries</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submitted Scores</CardTitle>
            <CardDescription>History of your score submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : submissions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No submissions yet</h3>
                <p className="text-muted-foreground mt-1">
                  Your submitted scores will appear here
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.exam_terms?.term_name}</TableCell>
                      <TableCell>{submission.classes?.class_name}</TableCell>
                      <TableCell>{submission.subjects?.subject_name}</TableCell>
                      <TableCell>
                        {new Date(submission.updated_at || "").toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge>Submitted</Badge>
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

export default Submissions;
