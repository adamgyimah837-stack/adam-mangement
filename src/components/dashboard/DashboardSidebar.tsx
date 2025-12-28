import { 
  Home, 
  Users, 
  UserCog, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  DollarSign, 
  Settings, 
  Shield,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type MenuItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: { title: string; href: string }[];
};

const adminMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  {
    title: "User Management",
    icon: Users,
    subItems: [
      { title: "All Students", href: "/students" },
      { title: "All Teachers", href: "/teachers" },
      { title: "Parents", href: "/parents" },
      { title: "Role Assignments", href: "/roles" },
    ],
  },
  {
    title: "Academic",
    icon: BookOpen,
    subItems: [
      { title: "Classes", href: "/classes" },
      { title: "Subjects", href: "/subjects" },
      { title: "Academic Years", href: "/academic-years" },
      { title: "Timetable", href: "/timetable" },
    ],
  },
  {
    title: "Results",
    icon: ClipboardCheck,
    subItems: [
      { title: "Manage Results", href: "/admin/results" },
      { title: "Generate Reports", href: "/admin/reports" },
    ],
  },
  {
    title: "Attendance",
    icon: Calendar,
    subItems: [
      { title: "Daily Attendance", href: "/attendance/daily" },
      { title: "Attendance Reports", href: "/attendance/reports" },
    ],
  },
  {
    title: "Finance",
    icon: DollarSign,
    subItems: [
      { title: "Fee Structure", href: "/fees/structure" },
      { title: "Payments", href: "/fees/payments" },
      { title: "Reports", href: "/fees/reports" },
    ],
  },
  { title: "Analytics", icon: BarChart3, href: "/analytics" },
  { title: "Settings", icon: Settings, href: "/settings" },
];

const teacherMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  {
    title: "My Classes",
    icon: BookOpen,
    subItems: [
      { title: "Class List", href: "/my-classes" },
      { title: "Timetable", href: "/my-timetable" },
    ],
  },
  {
    title: "Scores & Results",
    icon: ClipboardCheck,
    subItems: [
      { title: "Enter Scores", href: "/teacher/scores" },
      { title: "My Submissions", href: "/teacher/submissions" },
    ],
  },
  {
    title: "Attendance",
    icon: Calendar,
    subItems: [
      { title: "Mark Attendance", href: "/attendance/mark" },
      { title: "Attendance History", href: "/attendance/history" },
    ],
  },
  {
    title: "Assessments",
    icon: FileText,
    subItems: [
      { title: "Assignments", href: "/assignments" },
      { title: "Exams", href: "/exams" },
    ],
  },
  { title: "Messages", icon: MessageSquare, href: "/messages" },
];

const studentMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  {
    title: "Academics",
    icon: GraduationCap,
    subItems: [
      { title: "My Classes", href: "/student/classes" },
      { title: "Timetable", href: "/student/timetable" },
      { title: "Assignments", href: "/student/assignments" },
    ],
  },
  {
    title: "Results",
    icon: ClipboardCheck,
    subItems: [
      { title: "My Results", href: "/student/results" },
      { title: "Report Card", href: "/student/report-card" },
    ],
  },
  { title: "Attendance", icon: Calendar, href: "/attendance" },
  { title: "Notifications", icon: Bell, href: "/notifications" },
];

const parentMenuItems: MenuItem[] = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  {
    title: "My Children",
    icon: Users,
    subItems: [
      { title: "Overview", href: "/children" },
      { title: "Attendance", href: "/children/attendance" },
      { title: "Grades", href: "/children/grades" },
    ],
  },
  {
    title: "Finance",
    icon: DollarSign,
    subItems: [
      { title: "Fee Status", href: "/fees/status" },
      { title: "Payment History", href: "/fees/history" },
    ],
  },
  { title: "Messages", icon: MessageSquare, href: "/messages" },
  { title: "Notifications", icon: Bell, href: "/notifications" },
];

const roleConfig: Record<string, { menuItems: MenuItem[]; label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { menuItems: adminMenuItems, label: "Administrator", icon: Shield, color: "text-primary" },
  teacher: { menuItems: teacherMenuItems, label: "Teacher", icon: GraduationCap, color: "text-green-600" },
  student: { menuItems: studentMenuItems, label: "Student", icon: BookOpen, color: "text-blue-600" },
  parent: { menuItems: parentMenuItems, label: "Parent", icon: Users, color: "text-purple-600" },
};

export function DashboardSidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useUserRole();
  const { state } = useSidebar();
  
  const config = roleConfig[role || "student"];
  const menuItems = config?.menuItems || studentMenuItems;
  const RoleIcon = config?.icon || BookOpen;

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            S
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">School MS</span>
              <span className={`text-xs ${config?.color || "text-primary"}`}>
                {config?.label || "User"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild>
                                <NavLink 
                                  to={subItem.href}
                                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                                  activeClassName="text-sidebar-primary font-medium"
                                >
                                  {subItem.title}
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.href || "#"}
                        className="text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">
                    {user?.fullName || "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              tooltip="Sign Out"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
