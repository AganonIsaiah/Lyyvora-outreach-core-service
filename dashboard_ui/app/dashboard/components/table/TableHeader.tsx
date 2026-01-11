"use client";

import { useDashboardContext } from "@/context/DashboardContext";

export default function TableHeader() {
  const { showExport } = useDashboardContext();

  const handleExport = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/export-smartlead-csv",
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "smartlead_ready.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      alert("Smartlead CSV exported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    }
  };

  return (
    <h1 className="relative rounded-t-lg shadow-sm border border-gray-200 w-full flex items-center px-8 h-14">
      <span className="absolute left-1/2 -translate-x-1/2 font-semibold">
        Clinic Table
      </span>

      {showExport && (
        <button
          onClick={handleExport}
          className="ml-auto text-sm bg-blue-500 text-white px-2 py-1.5 rounded hover:bg-blue-600 cursor-pointer transition-all duration-200"
        >
          Export Smartlead CSV
        </button>
      )}
    </h1>
  );
}
