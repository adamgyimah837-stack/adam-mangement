import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

const Students = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          profiles:user_id(full_name, email, phone),
          classes:class_id(class_name, grade_level)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ user_id: "", student_id: "", class_id: "", parent_user_id: "", gender: "", guardian_name: "" });
  const [profiles, setProfiles] = useState<any[]>([]);
  const { data: classes } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, class_name").order("grade_level", { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name", { ascending: true });
        setProfiles(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadProfiles();
  }, []);

  const handleInput = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleAddStudent = async () => {
    if (!form.user_id || !form.student_id || !form.class_id) {
      toast.error("Please fill required fields: assign existing user, student ID and class");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("students").insert([{
        user_id: form.user_id,
        student_id: form.student_id,
        class_id: form.class_id,
        parent_user_id: form.parent_user_id || null,
        gender: form.gender || null,
        guardian_name: form.guardian_name || null,
      }]);
      if (error) throw error;
      toast.success("Student added successfully");
      setDialogOpen(false);
      // refetch students via react-query
      // We can invalidate queries, but simplest is reload window or rely on query key change.
      window.location.reload();
    } catch (err) {
      console.error("Error adding student:", err);
      toast.error((err as any)?.message || "Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students?.filter(student =>
    student.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Students</h1>
            <p className="text-muted-foreground">Manage and view all student records</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <div className="flex items-center gap-2">
                <Link to="/admin/create-user?role=student">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Student Account
                  </Button>
                </Link>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </DialogTrigger>
              </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Create student and link to a user and parent</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label>Assign Existing User *</Label>
                  <Select value={form.user_id} onValueChange={(v) => handleInput("user_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} — {p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student ID *</Label>
                  <Input value={form.student_id} onChange={(e) => handleInput("student_id", e.target.value)} />
                </div>
                <div>
                  <Label>Class *</Label>
                  <Select value={form.class_id} onValueChange={(v) => handleInput("class_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Parent (optional)</Label>
                  <Select value={form.parent_user_id} onValueChange={(v) => handleInput("parent_user_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name} — {p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gender</Label>
                  <Input value={form.gender} onChange={(e) => handleInput("gender", e.target.value)} />
                </div>
                <div>
                  <Label>Guardian Name</Label>
                  <Input value={form.guardian_name} onChange={(e) => handleInput("guardian_name", e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddStudent} disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : 'Add Student'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Records</CardTitle>
                <CardDescription>
                  Total: {students?.length || 0} students
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading students...</div>
            ) : filteredStudents?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No students found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.profiles?.full_name || "N/A"}</TableCell>
                      <TableCell>{student.classes?.class_name || "Unassigned"}</TableCell>
                      <TableCell className="capitalize">{student.gender || "N/A"}</TableCell>
                      <TableCell>{student.guardian_name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>
                          {student.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
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

export default Students;
