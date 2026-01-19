import LoginCard from "./components/LoginCard";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Login() {
  const user = await getCurrentUser();
  console.log("user: ", user)
  if (user) redirect("/dashboard");
  return (
    <div className="flex justify-center items-center h-screen!">
      <LoginCard />
    </div>
  );
}
