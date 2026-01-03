"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_ROUTES } from "@/lib/constants";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen min-w-45!  border-r border-gray-200 shadow-sm">
      <h1></h1>

      <nav className="flex flex-col !mt-4">
        {SIDEBAR_ROUTES.map((route) => {
          const isActive = pathname === route.href;

          return (
            <Link
              key={route.href}
              href={route.href}
              className={
                isActive
                  ? "bg-gray-100 text-gray-900 border-l-2 border-gray-900"
                  : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                
              }
            >
              <p className="p-2!">{route.label}</p>
              
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
