"use client";

import { useEffect } from "react";
import LoginCard from "./components/LoginCard";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const user = await getCurrentUser();
      console.log("Current user:", user);
      if (user) router.push("/dashboard");
    }
    fetchUser();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <LoginCard />
    </div>
  );
}
