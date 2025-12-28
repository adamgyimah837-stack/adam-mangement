import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const StudentOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [form, setForm] = useState({ student_id: "", class_id: "", gender: "", dob: "", guardian_name: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("classes").select("id, class_name").order("grade_level", { ascending: true });
        setClasses(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.student_id || !form.class_id) {
      toast.error("Please provide student ID and class");
      return;
    }

    setLoading(true);
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error("Not authenticated");

      const payload: any = {
        user_id: authUser.user.id,
        student_id: form.student_id,
        class_id: form.class_id,
        gender: form.gender || null,
        dob: form.dob || null,
        guardian_name: form.guardian_name || null,
      };

      const { error } = await supabase.from("students").insert([payload]);
      if (error) throw error;

      toast.success("Profile saved");
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error((error as any)?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Complete your student profile</h2>
      <p className="text-sm text-muted-foreground mb-4">Please provide basic information to complete your profile.</p>
      <div className="grid gap-3">
        <div>
          <Label>Student ID</Label>
          <Input value={form.student_id} onChange={(e) => handleChange("student_id", e.target.value)} />
        </div>
        <div>
          <Label>Class</Label>
          <Select value={form.class_id} onValueChange={(v) => handleChange("class_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Gender</Label>
          <Input value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} />
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input type="date" value={form.dob} onChange={(e) => handleChange("dob", e.target.value)} />
        </div>
        <div>
          <Label>Guardian Name</Label>
          <Input value={form.guardian_name} onChange={(e) => handleChange("guardian_name", e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save Profile"}</Button>
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;
