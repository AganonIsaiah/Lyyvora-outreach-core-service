"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import { IMPORT_COLUMNS } from "@/lib/constants";
import { useImportCsv } from "@/hooks/useImportCsv";
import { useConfirm } from "@/context/ConfirmContext";
import { useAuth } from "@/hooks/useAuth";

interface ImportCardProps {
  onColumnsToggle?: (open: boolean) => void;
}

export default function ImportCard({ onColumnsToggle }: ImportCardProps) {
  const importColumns = IMPORT_COLUMNS;
  const { showExport } = useDashboardContext();
  const { isAdmin } = useAuth();

  const { confirm } = useConfirm();
  const {
    fileInputRef,
    loadingReplace,
    loadingAppend,
    openFilePicker,
    handleFileChange,
  } = useImportCsv();

  const handleReplace = async () => {
    const ok = await confirm({
      title: "Replace CSV",
      message:
        "This will overwrite all existing clinic data with the new file. This cannot be undone.",
      confirmLabel: "Replace",
      variant: "danger",
    });
    if (ok) openFilePicker("import");
  };

  function ColumnChips({ columns }: { columns: string[] }) {
    return (
      <div className={`flex flex-wrap gap-1.5 mt-2 ${!isAdmin ? 'py-1.75' : ''}`}>
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

  return (
    <div className={`card-section ${!showExport ? "border-0! shadow-none!" : ""}`}>
      <h2>{showExport ? "Import Data" : "Import CSV"}</h2>

      <p className="text-slate-400 text-xs mt-1">
        {showExport
          ? "Replace or append to the existing dataset."
          : "Import a CSV to begin outreach."}
      </p>

      {isAdmin ? (
        <details
          className="mt-2"
          onToggle={(e) => onColumnsToggle?.((e.target as HTMLDetailsElement).open)}
        >
          <summary className="text-xs text-indigo-500 cursor-pointer select-none hover:text-indigo-600">
            Required columns
          </summary>
          <ColumnChips columns={importColumns} />
        </details>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-indigo-500">Required columns</p>
          <ColumnChips columns={importColumns} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleFileChange}
      />

      <div className="flex gap-2 mt-3">
        {(!showExport || isAdmin) && (
          <button
            disabled={loadingReplace || loadingAppend}
            onClick={showExport ? handleReplace : () => openFilePicker("import")}
            className="flex-1 bg-indigo-500 text-white text-xs font-semibold rounded px-3 py-1.5 cursor-pointer hover:bg-indigo-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingReplace ? "Importing..." : showExport ? "Replace" : "Import CSV"}
          </button>
        )}

        {showExport && (
          <button
            disabled={loadingReplace || loadingAppend}
            onClick={() => openFilePicker("append")}
            className="flex-1 bg-white text-indigo-600 text-xs font-semibold rounded px-3 py-1.5 border border-indigo-200 cursor-pointer hover:bg-indigo-50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingAppend ? "Appending..." : "Append"}
          </button>
        )}
      </div>
    </div>
  );
}
