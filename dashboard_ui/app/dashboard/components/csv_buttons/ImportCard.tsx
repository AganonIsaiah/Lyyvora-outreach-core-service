"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import EmergencyIcon from "@mui/icons-material/Emergency";
import { IMPORT_COLUMNS } from "@/lib/constants";

export default function ImportCard() {
  const importColumns = IMPORT_COLUMNS;

  const { clinics } = useDashboardContext();

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
    <div
      className={`card-section ${
        clinics.length <= 0 || !clinics
          ? "w-full! border-0! shadow-none!"
          : "w-120!"
      }`}
    >
      <h2 className="text-base font-semibold">
        {clinics && clinics.length > 0
          ? "Update CSV"
          : "Import CSV"}
      </h2>

      <p className="text-slate-400 text-xs flex gap-1 mt-0.5">
        <EmergencyIcon className="text-[10px]! mt-0.5" />
         {clinics && clinics.length > 0
          ? "Append or replace the CSV file to continue outreach, include following columns:"
          : "Import a CSV file to begin outreach, include the following columns:"}
      </p>

      <ColumnChips columns={importColumns} />

      <div className="flex">
        {clinics.length <= 0 || !clinics ? (
          <button className="bg-blue-500 text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer hover:bg-blue-600 transition-all duration-200">
            Import CSV
          </button>
        ) : (
          <div className="flex gap-4">
            <button className="bg-blue-500 text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer hover:bg-blue-600 transition-all duration-200">
              Replace CSV
            </button>

            <button className="bg-teal-500 text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer hover:bg-teal-600 transition-all duration-200">
              Append to CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
