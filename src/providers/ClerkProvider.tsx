import { ClerkProvider as ClerkReactProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_aW5jbHVkZWQta2l0LTczLmNsZXJrLmFjY291bnRzLmRldiQ";

interface ClerkProviderProps {
  children: ReactNode;
}

export const ClerkProvider = ({ children }: ClerkProviderProps) => {
  return (
    <ClerkReactProvider publishableKey={PUBLISHABLE_KEY}>
      {children}
    </ClerkReactProvider>
  );
};
