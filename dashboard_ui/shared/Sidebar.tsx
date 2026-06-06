"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_ROUTES } from "@/lib/constants";
import { Routes } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();

  const isClinicDetail = pathname.startsWith("/clinics/");
  const clinicId = isClinicDetail ? pathname.split("/")[2] : null;

  return (
    <aside className="min-h-screen min-w-45 border-r border-gray-200 shadow-sm">
      <div className="separator" />

      <nav className="flex flex-col mt-4">
        {SIDEBAR_ROUTES.map((route) => {
          if (route.href === Routes.CLINICS && !isClinicDetail) {
            return null;
          }

          const isActive =
            pathname === route.href || pathname.startsWith(`${route.href}/`);

          return (
            <Link
              key={route.href}
              href={route.href}
              className={`transition-colors ${
                isActive
                  ? "bg-[#f3ece0] text-[#2a1311] border-l-2 border-[#d22624]"
                  : "border-transparent text-gray-600 hover:bg-[#f3ece0] hover:text-[#2a1311]"
              }`}
            >
              <p className="p-2">{route.label}</p>
            </Link>
          );
        })}

        {isClinicDetail && clinicId && (
          <Link
            href={`/clinics/${clinicId}`}
            className={`transition-colors ${
              pathname === `/clinics/${clinicId}`
                ? "bg-[#f3ece0] text-[#2a1311] border-l-2 border-[#d22624]"
                : "border-transparent text-gray-600 hover:bg-[#f3ece0] hover:text-[#2a1311]"
            }`}
          >
            <p className="p-2">Clinic {clinicId}</p>
          </Link>
        )}
      </nav>
    </aside>
  );
}
