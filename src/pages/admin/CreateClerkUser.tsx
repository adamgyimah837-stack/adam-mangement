import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// This component creates users in Clerk via Supabase Edge Function
// The edge function handles Clerk API calls securely with CLERK_SECRET_KEY

const CreateClerkUser = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "student";
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", role: initialRole, guardianName: "", guardianEmail: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
  if (!form.email || !form.firstName) {
    toast.error("Email and first name are required");
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        guardianName: form.guardianName,
        guardianEmail: form.guardianEmail,
      },
    });

    if (error) throw error;

    console.log('Invite result', data);

    if (data?.inviteSent) {
      toast.success(`Invite sent to ${form.email}`);
    } else if (data?.password) {
      toast.success(`User created. Default password: ${data.password}`);
    } else {
      toast.success(`User created. Clerk ID: ${data?.clerkId || 'N/A'}`);
    }

    setForm({ email: "", firstName: "", lastName: "", role: "student" });
  } catch (err: any) {
    console.error("Create user error:", err);
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }, { label: "Create Clerk User" }]}>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Clerk User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
                <strong>Setup Required:</strong> Deploy the Supabase Edge Function with:
                <ul className="mt-2 list-disc list-inside text-xs">
                  <li>CLERK_SECRET_KEY environment variable</li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">supabase functions deploy create-clerk-user</code></li>
                </ul>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                </div>
              </div>
              {form.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Guardian Name</Label>
                    <Input value={form.guardianName} onChange={(e) => handleChange("guardianName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Guardian Email</Label>
                    <Input value={form.guardianEmail} onChange={(e) => handleChange("guardianEmail", e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateClerkUser;
