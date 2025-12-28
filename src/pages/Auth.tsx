import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const Auth = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if mode is set in URL
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-lg border border-border/50 rounded-xl",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-gradient-primary hover:opacity-90",
                  footerActionLink: "text-primary hover:text-primary/80",
                },
              }}
              signInUrl="/auth"
              afterSignUpUrl="/dashboard"
            />
          ) : (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-lg border border-border/50 rounded-xl",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-gradient-primary hover:opacity-90",
                  footerActionLink: "text-primary hover:text-primary/80",
                },
              }}
              signUpUrl="/auth?mode=signup"
              afterSignInUrl="/dashboard"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
