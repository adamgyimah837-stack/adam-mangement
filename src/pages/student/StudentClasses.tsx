import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

const StudentClasses = () => {
  const { user } = useUser();

  const { data: studentData, isLoading } = useQuery({
    queryKey: ["student-class", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes:class_id(
            class_name, 
            grade_level, 
            section
          )
        `)
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: subjects } = useQuery({
    queryKey: ["class-subjects", studentData?.class_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select(`
          id,
          subjects:subject_id(subject_name),
          teachers:teacher_id(
            profiles:user_id(full_name)
          )
        `)
        .eq("class_id", studentData?.class_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentData?.class_id,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">Your enrolled class and subjects</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !studentData?.classes ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Not enrolled in any class</h3>
              <p className="text-muted-foreground mt-1">
                Contact admin to get enrolled in a class
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{studentData.classes.class_name}</CardTitle>
                <CardDescription>
                  Grade {studentData.classes.grade_level}
                  {studentData.classes.section && ` - Section ${studentData.classes.section}`}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>Subjects taught in your class</CardDescription>
              </CardHeader>
              <CardContent>
                {!subjects || subjects.length === 0 ? (
                  <p className="text-muted-foreground">No subjects assigned yet</p>
                ) : (
                  <div className="grid gap-3">
                    {subjects.map((assignment: any) => (
                      <div key={assignment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">{assignment.subjects?.subject_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {assignment.teachers?.profiles?.full_name || "TBA"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentClasses;
