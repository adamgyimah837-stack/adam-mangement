import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TimetableEntry {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
  room: string;
}

interface Class {
  id: string;
  class_name: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface Teacher {
  id: string;
  profiles: { full_name: string };
}

const Timetable = () => {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    room: "",
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timetableRes, classesRes, subjectsRes, teachersRes] =
        await Promise.all([
          supabase
            .from("timetables")
            .select(
              `
            id,
            day_of_week,
            start_time,
            end_time,
            room,
            classes(class_name),
            subjects(subject_name),
            teachers ( profiles ( full_name ) )
          `
            )
            .order("day_of_week"),
          supabase.from("classes").select("id, class_name"),
          supabase.from("subjects").select("id, subject_name"),
          // try fetching from teachers table; if empty, fall back to user_roles (Clerk-synced)
          supabase
            .from("teachers")
            .select(
              `
            id,
            profiles(full_name)
          `
            ),
        ]);

      if (timetableRes.data) {
        const formattedTimetables = (timetableRes.data || []).map((t: any) => ({
          id: t.id,
          day_of_week: t.day_of_week,
          start_time: t.start_time,
          end_time: t.end_time,
          subject_name: t.subjects?.subject_name || "Unknown",
          class_name: t.classes?.class_name || "Unknown",
          teacher_name: t.teachers?.profiles?.full_name || "Unknown",
          room: t.room || "N/A",
        }));
        setTimetables(formattedTimetables);
      }

      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);

      // teachersRes may be empty if app relies on Clerk roles instead of an internal teachers table
      if (teachersRes.data && teachersRes.data.length > 0) {
        setTeachers(teachersRes.data);
      } else {
        // fallback: fetch users with role=teacher from user_roles and join profiles
        try {
          const { data: roleTeachers, error: roleErr } = await supabase
            .from('user_roles')
            .select(`user_id, profiles(full_name)`)
            .eq('role', 'teacher');

          if (!roleErr && roleTeachers) {
            const mapped = roleTeachers.map((r: any) => ({ id: r.user_id, profiles: { full_name: r.profiles?.full_name || 'Unknown' } }));
            setTeachers(mapped);
          }
        } catch (err) {
          console.warn('Failed to load teachers from user_roles fallback', err);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load timetable data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = async () => {
    if (
      !formData.class_id ||
      !formData.subject_id ||
      !formData.teacher_id ||
      !formData.day_of_week ||
      !formData.start_time ||
      !formData.end_time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("timetables").insert([
        {
          class_id: formData.class_id,
          subject_id: formData.subject_id,
          teacher_id: formData.teacher_id,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          room: formData.room || null,
        },
      ]);

      if (error) throw error;

      toast.success("Timetable entry created successfully");
      setFormData({
        class_id: "",
        subject_id: "",
        teacher_id: "",
        day_of_week: "",
        start_time: "",
        end_time: "",
        room: "",
      });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating timetable:", error);
      toast.error((error as any)?.message || "Failed to create timetable entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("timetables")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Timetable entry deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error((error as any)?.message || "Failed to delete timetable entry");
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
            <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
            <p className="text-muted-foreground">
              Manage class schedules and timetables
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Timetable Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Timetable Entry</DialogTitle>
                <DialogDescription>
                  Add a new class to the school timetable
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="class_id">Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) =>
                      handleSelectChange("class_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject_id">Subject *</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) =>
                      handleSelectChange("subject_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher_id">Teacher *</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) =>
                      handleSelectChange("teacher_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.profiles.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week *</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) =>
                      handleSelectChange("day_of_week", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange(e, "start_time")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange(e, "end_time")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room/Venue</Label>
                  <Input
                    id="room"
                    placeholder="e.g., Room 101"
                    value={formData.room}
                    onChange={(e) => handleInputChange(e, "room")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTimetable} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Entry"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>School Timetable</CardTitle>
            <CardDescription>
              View and manage class schedules - Total: {timetables.length}{" "}
              entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : timetables.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.day_of_week}
                      </TableCell>
                      <TableCell>
                        {entry.start_time} - {entry.end_time}
                      </TableCell>
                      <TableCell>{entry.class_name}</TableCell>
                      <TableCell>{entry.subject_name}</TableCell>
                      <TableCell>{entry.teacher_name}</TableCell>
                      <TableCell>{entry.room}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
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
                <h3 className="text-lg font-medium">No timetable configured</h3>
                <p className="text-muted-foreground mt-1">
                  Create a timetable to schedule classes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Timetable;
