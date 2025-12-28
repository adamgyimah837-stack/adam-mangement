import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Roles = () => {
  const { data: userRoles, isLoading, refetch } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "teacher": return "default";
      case "student": return "secondary";
      case "parent": return "outline";
      default: return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Assignments</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
          <div>
            <Button
              onClick={async () => {
                try {
                  const res = await fetch('/.netlify/functions/sync-clerk-roles', { method: 'POST' });
                  let json: any = null;
                  try {
                    json = await res.json();
                  } catch (parseErr) {
                    // empty or non-JSON response
                    const text = await res.text().catch(() => '');
                    if (!res.ok) throw new Error(text || res.statusText || 'Sync failed');
                  }

                  if (!res.ok) {
                    const errMsg = (json && (json.error || json.message)) || res.statusText || 'Sync failed';
                    throw new Error(errMsg);
                  }

                  refetch();
                  alert((json && (json.message || json.details)) || 'Synced roles');
                } catch (err: any) {
                  console.error('Sync error', err);
                  alert(err.message || 'Sync failed');
                }
              }}
            >
              Sync Roles
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {["admin", "teacher", "student", "parent"].map((role) => (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">{role}s</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userRoles?.filter(ur => ur.role === role).length || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <div>
                <CardTitle>All Role Assignments</CardTitle>
                <CardDescription>Users and their assigned roles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
            ) : userRoles?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No role assignments</h3>
                <p className="text-muted-foreground mt-1">
                  Role assignments will appear here
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles?.map((ur) => (
                    <TableRow key={ur.id}>
                      <TableCell className="font-medium">
                        {ur.profiles?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{ur.profiles?.email || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(ur.role)}>
                          {ur.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(ur.created_at || "").toLocaleDateString()}
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

export default Roles;
