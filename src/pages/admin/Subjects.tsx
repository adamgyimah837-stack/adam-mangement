import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Loader2, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  description: string;
}

const Subjects = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    description: "",
  });

  const { data: subjects, isLoading, refetch } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("subject_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleAddSubject = async () => {
    if (!formData.subject_name) {
      toast.error("Please enter subject name");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("subjects")
        .insert([
          {
            subject_code: formData.subject_code || null,
            subject_name: formData.subject_name,
            description: formData.description || null,
          },
        ]);

      if (error) throw error;

      toast.success("Subject added successfully");
      setFormData({
        subject_code: "",
        subject_name: "",
        description: "",
      });
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error((error as any)?.message || "Failed to add subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Subject deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error((error as any)?.message || "Failed to delete subject");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
            <p className="text-muted-foreground">Manage subjects and courses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>
                  Create a new subject for your school curriculum
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_code">Subject Code</Label>
                  <Input
                    id="subject_code"
                    placeholder="e.g., ENG101"
                    value={formData.subject_code}
                    onChange={(e) => handleInputChange(e, "subject_code")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject_name">Subject Name *</Label>
                  <Input
                    id="subject_name"
                    placeholder="e.g., English Language"
                    value={formData.subject_name}
                    onChange={(e) => handleInputChange(e, "subject_name")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the subject"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange(e, "description")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSubject} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Subject"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
            <CardDescription>
              Total: {subjects?.length || 0} subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : subjects && subjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">
                        {subject.subject_code || "N/A"}
                      </TableCell>
                      <TableCell>{subject.subject_name}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {subject.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
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
                <h3 className="text-lg font-medium">No subjects created yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first subject to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Subjects;
