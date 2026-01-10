"use client";

import { useDashboardContext } from "@/context/DashboardContext";

export default function Header() {
  const { showExport } = useDashboardContext();

  const handleExport = async () => {
    try {
      const response = await fetch("http://localhost:8000/export-smartlead-csv", {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "smartlead_ready.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    }
  };

  return (
    <div className="separator flex justify-between items-center px-8!">
      <h1>Outreach Dashboard</h1>
      {showExport && (
        <button
          onClick={handleExport}
          className="bg-blue-500 text-white px-4 py-2 rounded font-semibold! hover:bg-blue-600 cursor-pointer transition-all duration-200"
        >
          Export CSV
        </button>
      )}
    </div>
  );
}
