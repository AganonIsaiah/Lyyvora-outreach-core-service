"use client";

import { useEffect, useState } from "react";
import LoginCard from "./components/LoginCard";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // show loading until we know user
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const u = await getCurrentUser();
      console.log("Current user:", u);
      setUser(u);
      setLoading(false);
      if (u) router.replace("/dashboard"); // use replace instead of push to avoid back button issues
    }
    fetchUser();
  }, [router]);

  if (loading) return <div>Loading...</div>; // avoid flashing login form

  return (
    <div className="flex justify-center items-center h-screen">
      {!user && <LoginCard />}
    </div>
  );
}
