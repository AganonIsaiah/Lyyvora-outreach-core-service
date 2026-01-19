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
      console.log("Current user:", user); // <-- Log the user
      if (user) {
        console.log("User exists, redirecting..."); // Optional additional log
        router.push("/dashboard");
      } else {
        console.log("No user, staying on login page"); // Optional
      }
    }
    fetchUser();
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <LoginCard />
    </div>
  );
}
