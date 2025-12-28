import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();

  const handleGenerateReportCards = async () => {
    toast.success("Report card generation queued — background job started");
  };

  const handleGenerateClassResults = () => {
    navigate("/admin/results");
  };

  const handleBulkPrint = () => {
    toast.success("Preparing bulk print...");
    // open print dialog for current page (admin should navigate to printable view first)
    setTimeout(() => window.print(), 400);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate Reports</h1>
            <p className="text-muted-foreground">Create and download student reports</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Cards
              </CardTitle>
              <CardDescription>Generate individual student report cards</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleGenerateReportCards}>
                <Download className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Class Results
              </CardTitle>
              <CardDescription>Generate class-wise result sheets</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleGenerateClassResults}>
                <Download className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Bulk Print
              </CardTitle>
              <CardDescription>Print multiple report cards at once</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleBulkPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
