"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import { useExportSmartlead } from "@/hooks/useExportSmartlead";

export default function TableHeader() {
  const { showExport } = useDashboardContext();
  const { exportCSV, loading } = useExportSmartlead();

  return (
    <h1 className="relative rounded-t-lg  border border-gray-200 w-full flex items-center px-8 h-14">
      <span className="absolute left-1/2 -translate-x-1/2 font-semibold">
        Clinic Table
      </span>

      {showExport && (
        <button
          onClick={exportCSV}
          disabled={loading}
          className={`ml-auto text-sm bg-amber-500 text-white px-2 py-1.5 rounded hover:bg-amber-600 cursor-pointer transition-all duration-200 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Loading..." : "Export Smartlead CSV"}
        </button>
      )}
    </h1>
  );
}