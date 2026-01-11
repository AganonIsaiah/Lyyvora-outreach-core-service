"use client";

import EmergencyIcon from "@mui/icons-material/Emergency";
import { useDashboardContext } from "@/context/DashboardContext";

export default function DropTableCard() {
  const { showExport } = useDashboardContext();

  if (!showExport) return;

  const handleDropTables = async () => {
    const confirmed = confirm(
      "Are you sure you want to clear the database? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      const response = await fetch("http://localhost:8000/drop-tables", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to drop tables");
      }

      const data = await response.json();
      alert(data.message || "Tables dropped successfully");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error dropping tables");
    }
  };

  return (
    <div className="card-section">
      <h2>Clear Database</h2>
       <p className="text-slate-400 text-xs flex gap-1 mt-0.5">
        <EmergencyIcon className="text-[10px]! mt-0.5" />
        Click the Drop Tables button to clear the database
      </p>
      <button
        onClick={handleDropTables}
        className="mt-2! bg-red-500 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-red-600 transition-all duration-200 cursor-pointer"
      >
        Drop Tables
      </button>
    </div>
  );
}
