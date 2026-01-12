"use client";

import { useRef, useState } from "react";
import EmergencyIcon from "@mui/icons-material/Emergency";

import { useDashboardContext } from "@/context/DashboardContext";
import { IMPORT_COLUMNS } from "@/lib/constants";

const BASE_URL = "http://localhost:8000";

export default function ImportCard() {
  const importColumns = IMPORT_COLUMNS;
  const { showExport } = useDashboardContext();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMode, setUploadMode] = useState<"import" | "append">("import");

  function ColumnChips({ columns }: { columns: string[] }) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {columns.map((col) => (
          <span
            key={col}
            className="px-2 py-0.5 text-[11px] rounded-md 
                     bg-slate-100 text-slate-600 border border-slate-200"
          >
            {col}
          </span>
        ))}
      </div>
    );
  }

  function openFilePicker(mode: "import" | "append") {
    setUploadMode(mode);
    fileInputRef.current?.click();
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "import" | "append"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint = mode === "append" ? "/append-leads" : "/import-csv";

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`${mode} CSV failed`);

      alert(
        mode === "append"
          ? "CSV appended successfully"
          : "CSV imported successfully"
      );
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${mode} CSV`);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div
      className={`card-section ${
        !showExport ? "w-full! border-0! shadow-none!" : "w-120!"
      }`}
    >
      <h2 className="text-base font-semibold">
        {showExport ? "Replace or Append to the CSV " : "Import CSV"}
      </h2>

      <p className="text-slate-400 text-xs flex gap-1 mt-0.5">
        <EmergencyIcon className="text-[10px]! mt-0.5" />
        {showExport
          ? "Append or replace the CSV file to continue outreach, include following columns:"
          : "Import a CSV file to begin outreach, include the following columns:"}
      </p>

      <ColumnChips columns={importColumns} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={(e) => handleFileChange(e, uploadMode)}
      />

      <div className="flex gap-4">
        <button
          onClick={() => openFilePicker("import")}
          className={`bg-blue-500 text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer hover:bg-blue-600 transition-all duration-200`}
        >
          {showExport ? "Replace CSV" : "Import CSV"}
        </button>

        {showExport && (
          <button
            onClick={() => openFilePicker("append")}
            className={`bg-lime-500 text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer hover:bg-lime-600 transition-all duration-200`}
          >
            Append to CSV
          </button>
        )}
      </div>
    </div>
  );
}
