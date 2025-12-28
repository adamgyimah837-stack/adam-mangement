import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

const MyClasses = () => {
  const { user } = useUser();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teacher-assignments", user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      
      if (!teacher) return [];

      const { data, error } = await supabase
        .from("teacher_assignments")
        .select(`
          *,
          classes:class_id(class_name, grade_level, section),
          subjects:subject_id(subject_name)
        `)
        .eq("teacher_id", teacher.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">Classes and subjects you teach</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : assignments?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No classes assigned</h3>
              <p className="text-muted-foreground mt-1">
                Contact admin to get class assignments
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments?.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle>{assignment.classes?.class_name}</CardTitle>
                  <CardDescription>
                    Grade {assignment.classes?.grade_level} 
                    {assignment.classes?.section && ` - Section ${assignment.classes.section}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{assignment.subjects?.subject_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyClasses;
