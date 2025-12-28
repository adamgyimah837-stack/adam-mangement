import { useUser } from "@clerk/clerk-react";

export type UserRole = "admin" | "teacher" | "student" | "parent" | null;

export const useUserRole = (): { role: UserRole; isLoaded: boolean } => {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { role: null, isLoaded };
  }

  // Get role from Clerk public metadata
  const role = (user.publicMetadata?.role as UserRole) || null;

  return { role, isLoaded };
};
