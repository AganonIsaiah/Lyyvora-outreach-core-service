"use client";
import EmergencyIcon from "@mui/icons-material/Emergency";
import { useDashboardContext } from "@/context/DashboardContext";
import { EXPORT_COLUMNS } from "@/lib/constants";

export default function ExportCard() {
  const { filteredClinics } = useDashboardContext();

  if (!filteredClinics || filteredClinics.length <= 0) return;

  const exportColumns = EXPORT_COLUMNS;

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

  return (
    <div className="card-section">
      <h2 className="text-base font-semibold">Export Smartlead CSV</h2>

      <p className="text-slate-400 text-xs flex gap-1 mt-0.5">
        <EmergencyIcon className="text-[10px]! mt-0.5" />
        Exports a Smartlead-ready CSV with outreach content, includes the
        following columns:
      </p>

      <ColumnChips columns={exportColumns} />

      <button className="bg-slate-400! text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer">
        Export CSV
      </button>
    </div>
  );
}
