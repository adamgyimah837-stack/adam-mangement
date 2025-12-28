import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

const AcademicYears = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    year_name: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const { data: academicYears, isLoading, refetch } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleAddAcademicYear = async () => {
    if (!formData.year_name || !formData.start_date || !formData.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      // Normalize name for consistent comparisons
      const normalized = formData.year_name.trim();

      // Case-insensitive check for existing year (use ILIKE)
      const { data: existing, error: checkError } = await supabase
        .from("academic_years")
        .select("id")
        .ilike("year_name", normalized)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast.error("An academic year with this name already exists");
        setSaving(false);
        return;
      }

      // If this is marked as current, unset others
      if (formData.is_current) {
        await supabase
          .from("academic_years")
          .update({ is_current: false })
          .eq("is_current", true);
      }

      const { error } = await supabase
        .from("academic_years")
        .insert([
          {
            year_name: normalized,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_current: formData.is_current,
          },
        ]);

      if (error) {
        // Handle DB unique-constraint race or server-side duplicates
        const pgCode = (error as any)?.code || (error as any)?.details;
        if (pgCode === "23505" || (error as any)?.message?.includes("duplicate key")) {
          toast.error("An academic year with this name already exists");
        } else {
          throw error;
        }
      } else {
        toast.success("Academic year added successfully");
        setFormData({
          year_name: "",
          start_date: "",
          end_date: "",
          is_current: false,
        });
        setDialogOpen(false);
        refetch();
      }
    } catch (error) {
      console.error("Error adding academic year:", error);
      toast.error((error as any)?.message || "Failed to add academic year");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYear = async (id: string) => {
    try {
      const { error } = await supabase
        .from("academic_years")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Academic year deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting year:", error);
      toast.error((error as any)?.message || "Failed to delete academic year");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value =
      field === "is_current"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Years</h1>
            <p className="text-muted-foreground">Manage academic years and terms</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Academic Year</DialogTitle>
                <DialogDescription>
                  Create a new academic year for your school
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="year_name">Year Name *</Label>
                  <Input
                    id="year_name"
                    placeholder="e.g., 2024/2025"
                    value={formData.year_name}
                    onChange={(e) => handleInputChange(e, "year_name")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange(e, "start_date")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange(e, "end_date")}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="is_current"
                    type="checkbox"
                    checked={formData.is_current}
                    onChange={(e) => handleInputChange(e, "is_current")}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_current" className="cursor-pointer">
                    Set as current academic year
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAcademicYear} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Year"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Academic Years</CardTitle>
            <CardDescription>Configure academic year settings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : academicYears && academicYears.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicYears.map((year) => (
                    <TableRow key={year.id}>
                      <TableCell className="font-medium">{year.year_name}</TableCell>
                      <TableCell>
                        {new Date(year.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(year.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={year.is_current ? "default" : "secondary"}>
                          {year.is_current ? "Current" : "Past"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteYear(year.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  No academic years configured
                </h3>
                <p className="text-muted-foreground mt-1">
                  Create your first academic year to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AcademicYears;
