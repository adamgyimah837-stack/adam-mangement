import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// role selection removed — roles will be managed in Clerk
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

const BulkCreateUsers = () => {
  const [file, setFile] = useState<File | null>(null);
  
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const { user } = useUser();

  const handleFile = (f: File | null) => setFile(f);

  const parseAndUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    setProcessing(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Normalize rows to { firstName, lastName, email }
      const users = data.map((row) => {
        const email = row.email || row.Email || row["E-mail"] || "";
        const name = row.name || row.Name || "";
        let firstName = row.firstName || row.FirstName || row.first_name || "";
        let lastName = row.lastName || row.LastName || row.last_name || "";
        if (!firstName && name) {
          const parts = name.toString().split(" ");
          firstName = parts.shift() || "";
          lastName = parts.join(" ") || lastName;
        }
        return { email: email.toString().trim(), firstName: firstName.toString().trim(), lastName: lastName.toString().trim() };
      }).filter(u => u.email && u.firstName);

      if (users.length === 0) {
        toast.error("No valid rows found. Make sure the file has name/email columns.");
        setProcessing(false);
        return;
      }
      const rows = users.map((u) => ({
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName || null,
        status: 'pending',
        metadata: u,
        created_by: user?.id || null,
      }));

      const { data: insertData, error: insertError } = await supabase
        .from('pending_user_imports')
        .insert(rows)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error(insertError.message || 'Failed to save imports');
        setProcessing(false);
        return;
      }

      setResults((insertData as any[]) || null);
      toast.success('Bulk upload queued for processing');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse or upload file");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout breadcrumbs={[{ label: "Dashboard" }, { label: "Bulk Upload Users" }]}>
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Create Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              

              <div>
                <Label>Excel file (first sheet used)</Label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
              </div>

              <div className="flex justify-end">
                <Button onClick={parseAndUpload} disabled={processing}>{processing ? 'Processing...' : 'Upload & Create'}</Button>
              </div>

              {results && (
                <div>
                  <h3 className="font-semibold mb-2">Results</h3>
                  <div className="overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left">Email</th>
                          <th className="text-left">Status</th>
                          <th className="text-left">Clerk ID</th>
                          <th className="text-left">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={i} className="border-t">
                            <td>{r.email}</td>
                            <td>{r.success ? 'Created' : `Failed: ${r.error}`}</td>
                            <td>{r.id}</td>
                            <td>{r.password || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BulkCreateUsers;
