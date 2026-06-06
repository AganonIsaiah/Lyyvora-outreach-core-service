"use client";

import { useAppSelector } from "@/store/hooks";
import { selectIsAdmin, selectRole, selectUsername } from "@/store/authSlice";

export function useAuth() {
  const role = useAppSelector(selectRole);
  const username = useAppSelector(selectUsername);
  const isAdmin = useAppSelector(selectIsAdmin);
  return { role, username, isAdmin };
}
