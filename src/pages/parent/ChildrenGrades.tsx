import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const ChildrenGrades = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Children's Grades</h1>
          <p className="text-muted-foreground">View your children's academic performance</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Academic Results</CardTitle>
            <CardDescription>Grades and scores for your children</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No grades available</h3>
              <p className="text-muted-foreground mt-1">
                Results will appear once published
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChildrenGrades;
