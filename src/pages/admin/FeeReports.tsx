import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentRecord {
  id: string;
  student_name: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  class_name: string;
}

const FeeReports = () => {
  const [exporting, setExporting] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["fee-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          status,
          students ( student_id, profiles ( full_name ), classes ( class_name ) )
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((payment: any) => ({
        id: payment.id,
        student_name: payment.students?.profiles?.full_name || "Unknown",
        student_id: payment.students?.student_id || "N/A",
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || "Unknown",
        status: payment.status || "pending",
        class_name: payment.students?.classes?.class_name || "N/A",
      }));
    },
  });

  const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const successfulPayments = payments?.filter((p) => p.status === "completed").length || 0;

  const exportToPDF = async () => {
    if (!payments || payments.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text("Fee Reports", 14, 15);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

      // Add summary
      doc.setFontSize(11);
      doc.text("Summary", 14, 35);
      doc.setFontSize(9);
      doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 14, 42);
      doc.text(`Successful Payments: ${successfulPayments}`, 14, 49);

      // Add table
      const tableData = payments.map((p) => [
        p.student_id,
        p.student_name,
        p.class_name,
        `₦${p.amount.toLocaleString()}`,
        new Date(p.payment_date).toLocaleDateString(),
        p.payment_method,
        p.status,
      ]);

      autoTable(doc, {
        head: [
          [
            "Student ID",
            "Student Name",
            "Class",
            "Amount",
            "Date",
            "Method",
            "Status",
          ],
        ],
        body: tableData,
        startY: 60,
        theme: "grid",
        headStyles: {
          fillColor: [66, 133, 244],
          textColor: 255,
        },
      });

      doc.save("fee-reports.pdf");
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async () => {
    if (!payments || payments.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      const headers = [
        "Student ID",
        "Student Name",
        "Class",
        "Amount",
        "Date",
        "Method",
        "Status",
      ];
      const rows = payments.map((p) => [
        p.student_id,
        p.student_name,
        p.class_name,
        p.amount.toString(),
        new Date(p.payment_date).toLocaleDateString(),
        p.payment_method,
        p.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
      );
      element.setAttribute("download", "fee-reports.csv");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Reports</h1>
            <p className="text-muted-foreground">Financial reports and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Successful Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{successfulPayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{payments?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>All fee payment records</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : payments && payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.student_id}</TableCell>
                      <TableCell>{payment.student_name}</TableCell>
                      <TableCell>{payment.class_name}</TableCell>
                      <TableCell className="font-semibold">
                        ₦{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : payment.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No payment data available</h3>
                <p className="text-muted-foreground mt-1">
                  Reports will be generated once payments are recorded
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FeeReports;
