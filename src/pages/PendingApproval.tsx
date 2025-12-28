import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Clock, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PendingApproval = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">EduManage</h1>
          <p className="text-muted-foreground">School Management System</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <CardTitle className="text-xl">Account Pending Approval</CardTitle>
            <CardDescription className="text-base">
              Your account is awaiting role assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                Welcome, <span className="font-medium text-foreground">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</span>!
              </p>
              <p>
                An administrator needs to assign you a role (Admin, Teacher, Student, or Parent) before you can access the system.
              </p>
              <p>
                Please contact your school administrator if you haven't heard back within 24 hours.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Account Email</p>
              <p className="font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;
