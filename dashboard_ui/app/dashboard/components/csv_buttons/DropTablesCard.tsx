"use client";

import EmergencyIcon from "@mui/icons-material/Emergency";
import { useDashboardContext } from "@/context/DashboardContext";
import { useDropTables } from "@/hooks/useDropTables";
import { useAuth } from "@/hooks/useAuth";

export default function DropTableCard() {
  const { showExport } = useDashboardContext();
  const { dropTables, loading } = useDropTables();
  const { isAdmin } = useAuth();

  if (!showExport || !isAdmin) return null;

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <EmergencyIcon className="text-red-400 text-[12px]!" />
        <h2 className="text-red-600!">Danger Zone</h2>
      </div>

      <p className="text-red-400 text-xs">
        Permanently deletes all clinic and campaign data.
      </p>

      <button
        onClick={dropTables}
        disabled={loading}
        className="mt-3 w-full bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded border border-red-200 hover:bg-red-100 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Clearing..." : "Clear Database"}
      </button>
    </div>
  );
}
