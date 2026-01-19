"use client";

import EmergencyIcon from "@mui/icons-material/Emergency";
import { useDashboardContext } from "@/context/DashboardContext";
import { useDropTables } from "@/hooks/useDropTables";

export default function DropTableCard() {
  const { showExport } = useDashboardContext();
  const { dropTables, loading } = useDropTables();

  if (!showExport) return null;

  return (
    <div className="card-section">
      <h2>Clear Database</h2>

      <p className="text-slate-400 text-xs flex gap-1 mt-0.5">
        <EmergencyIcon className="text-[10px]! mt-0.5" />
        Click the Drop Tables button to clear the database
      </p>

      <button
        onClick={dropTables}
        disabled={loading}
        className="mt-2! bg-red-500 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-red-600 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Dropping..." : "Drop Tables"}
      </button>
    </div>
  );
}
