import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Payments = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<any[]>([]);

  const [form, setForm] = useState({ student_id: "", category_id: "", amount: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.from("students").select("id, profiles(full_name)");
      setStudents(s || []);
      const { data: cats } = await supabase.from("fee_categories").select("id,category_name,amount");
      setCategories(cats || []);
      const { data: recentPayments } = await supabase
        .from("payments")
        .select("*, students:student_id(id, profiles(full_name))")
        .order("payment_date", { ascending: false })
        .limit(10);
      setRecent(recentPayments || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreatePayment = async () => {
    if (!form.student_id || !form.amount) {
      toast.error("Please select a student and enter an amount");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("payments").insert([
        {
          student_id: form.student_id,
          category_id: form.category_id || null,
          amount: parseFloat(form.amount),
          payment_date: new Date().toISOString(),
          status: "completed",
        },
      ]).select();

      if (error) throw error;
      toast.success("Payment recorded");
      setForm({ student_id: "", category_id: "", amount: "" });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">View and manage fee payments</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Quickly record a fee payment for a student</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Student *</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.profiles?.full_name || s.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category (optional)</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.category_name} — ₦{c.amount}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₦) *</Label>
                <Input name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" type="number" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCreatePayment} disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Loading payments...</h3>
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No payments recorded</h3>
                <p className="text-muted-foreground mt-1">Payment transactions will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.students?.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell>₦{p.amount?.toLocaleString?.() ?? p.amount}</TableCell>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{p.status}</TableCell>
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

export default Payments;
