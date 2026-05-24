"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name: string): string {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface HeaderProps {
  title: string;
  showDashboardButton?: boolean;
}

export default function Header({ title, showDashboardButton = false }: HeaderProps) {
  const router = useRouter();
  const { username, role } = useAuth();

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  return (
    <div className="separator flex justify-between items-center px-8! sticky top-0 z-10 bg-white">
      <h1>{title}</h1>
      <div className="flex items-center gap-4">
        {username && (
          <div className="relative group">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-xs font-bold cursor-pointer select-none hover:bg-indigo-700 transition-all duration-200">
              {getInitials(username)}
            </div>
            <div className="absolute right-0 top-10 z-50 hidden group-hover:flex flex-col gap-0.5 bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 min-w-20 text-sm whitespace-nowrap">
              <span className="font-semibold text-gray-800">{username}</span>
              <span className="text-xs text-gray-400 capitalize">{role}</span>
            </div>
          </div>
        )}

        <div className="border border-r h-[30px] border-gray-300"></div>

        {showDashboardButton && (
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm bg-white text-indigo-600 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-50 transition-all duration-200"
          >
            Dashboard
          </button>
        )}
        <button
          onClick={handleLogout}
          className="text-sm bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-slate-200 transition-all duration-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
