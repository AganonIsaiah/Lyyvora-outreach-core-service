"use client";

import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  return (
    <div className="separator flex justify-between items-center px-8!">
      <h1>Outreach Dashboard</h1>
      <button
        onClick={handleLogout}
        className="text-sm bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-slate-200 transition-all duration-200"
      >
        Log out
      </button>
    </div>
  );
}
