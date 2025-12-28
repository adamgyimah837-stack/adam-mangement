import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Class {
  id: string;
  class_name: string;
  grade_level: number;
  section: string;
  capacity: number;
  academic_year_id: string;
  academic_years?: { year_name: string };
}

const Classes = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    class_name: "",
    grade_level: "",
    section: "",
    capacity: "",
    academic_year_id: "",
  });

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(
          `
          *,
          academic_years:academic_year_id(year_name)
        `
        )
        .order("grade_level", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id, year_name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleAddClass = async () => {
    if (
      !formData.class_name ||
      !formData.grade_level ||
      !formData.academic_year_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("classes")
        .insert([
          {
            class_name: formData.class_name,
            grade_level: parseInt(formData.grade_level),
            section: formData.section || null,
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            academic_year_id: formData.academic_year_id,
          },
        ]);

      if (error) throw error;

      toast.success("Class added successfully");
      setFormData({
        class_name: "",
        grade_level: "",
        section: "",
        capacity: "",
        academic_year_id: "",
      });
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error((error as any)?.message || "Failed to add class");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Class deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error((error as any)?.message || "Failed to delete class");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
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
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">Manage classes and sections</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Create a new class for your school
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class Name *</Label>
                  <Input
                    id="class_name"
                    placeholder="e.g., Grade 10A"
                    value={formData.class_name}
                    onChange={(e) => handleInputChange(e, "class_name")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade_level">Grade Level *</Label>
                    <Input
                      id="grade_level"
                      type="number"
                      min="1"
                      max="12"
                      placeholder="e.g., 10"
                      value={formData.grade_level}
                      onChange={(e) => handleInputChange(e, "grade_level")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      placeholder="e.g., A, B, C"
                      value={formData.section}
                      onChange={(e) => handleInputChange(e, "section")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="Number of students"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange(e, "capacity")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year_id">Academic Year *</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) =>
                      handleSelectChange("academic_year_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears?.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddClass} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Class"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
            <CardDescription>Total: {classes?.length || 0} classes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : classes && classes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.class_name}</TableCell>
                      <TableCell>Grade {cls.grade_level}</TableCell>
                      <TableCell>{cls.section || "N/A"}</TableCell>
                      <TableCell>{cls.capacity || "N/A"}</TableCell>
                      <TableCell>
                        {cls.academic_years?.year_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClass(cls.id)}
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
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No classes created yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first class to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Classes;
