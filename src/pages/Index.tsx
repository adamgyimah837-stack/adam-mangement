import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  Shield,
  Zap,
  CheckCircle,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Comprehensive student information system with enrollment, records, and tracking.",
    },
    {
      icon: BookOpen,
      title: "Academic Management",
      description: "Manage academic years, classes, subjects, and curriculum with ease.",
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description: "Real-time attendance monitoring with automated alerts and analytics.",
    },
    {
      icon: BarChart3,
      title: "Gradebook & Assessment",
      description: "Powerful gradebook with customizable grading scales and report cards.",
    },
    {
      icon: FileText,
      title: "Reporting & Analytics",
      description: "Comprehensive reports and dashboards for data-driven decisions.",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Built with security and privacy in mind, GDPR/FERPA compliant.",
    },
  ];

  const benefits = [
    "Streamline administrative tasks",
    "Improve communication between stakeholders",
    "Make data-driven decisions",
    "Enhance student outcomes",
    "Save time and resources",
    "Scalable from small schools to districts",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-2xl shadow-lg">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">EduManage</h1>
              <p className="text-xs text-muted-foreground">School Management System</p>
            </div>
          </div>
          <Button
            onClick={handleGetStarted}
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-md"
          >
            {isLoaded && isSignedIn ? "Go to Dashboard" : "Get Started"}
          </Button>
        </nav>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Transform Your School
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Administration
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A comprehensive school management system that streamlines administrative,
            academic, and communication processes for modern K–12 schools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg text-lg px-8"
            >
              <Zap className="mr-2 w-5 h-5" />
              {isLoaded && isSignedIn ? "Go to Dashboard" : "Start Free Trial"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2 hover:bg-primary/5"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need in One Platform
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to simplify school management and enhance educational excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="shadow-md hover:shadow-lg transition-all hover:-translate-y-1 border-border/50"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-card/50 backdrop-blur-sm border-y border-border/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose EduManage?
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Built by educators, for educators. EduManage understands the unique
                challenges of modern school administration and provides intuitive
                solutions that work.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-foreground text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-primary rounded-3xl p-8 shadow-2xl">
                <div className="bg-card rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full w-3/4 mb-2" />
                      <div className="h-2 bg-muted/50 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full w-2/3 mb-2" />
                      <div className="h-2 bg-muted/50 rounded-full w-1/3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full w-5/6 mb-2" />
                      <div className="h-2 bg-muted/50 rounded-full w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-primary shadow-2xl border-0">
          <CardContent className="text-center py-16 px-6">
            <h3 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your School?
            </h3>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of schools already using EduManage to streamline their
              operations and improve educational outcomes.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-background text-foreground hover:bg-background/90 shadow-lg text-lg px-8"
            >
              {isLoaded && isSignedIn ? "Go to Dashboard" : "Get Started Free"}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 EduManage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
