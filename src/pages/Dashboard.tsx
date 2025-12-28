import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { GraduationCap } from "lucide-react";
import AdminDashboard from "./dashboards/AdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import PendingApproval from "./PendingApproval";

const Dashboard = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { role, isLoaded: isRoleLoaded } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/auth");
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded || !isRoleLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // Route to appropriate dashboard based on role
  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    default:
      return <PendingApproval />;
  }
};

export default Dashboard;
