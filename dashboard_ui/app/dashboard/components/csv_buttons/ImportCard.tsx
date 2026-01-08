import EmergencyIcon from "@mui/icons-material/Emergency";
import { IMPORT_COLUMNS } from "@/lib/constants";

export default function ImportCard() {
  const importColumns = IMPORT_COLUMNS;

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
      <h2 className="text-base font-semibold">Import CSV</h2>

      <p className="text-slate-400 text-xs flex gap-1 mt-0.5">
        <EmergencyIcon className="text-[10px]! mt-0.5" />
        Import a CSV file to begin outreach, include the following columns:
      </p>

      <ColumnChips columns={importColumns} />

      <button className="bg-blue-500! text-white font-semibold rounded px-2 py-1 h-8! mt-4 cursor-pointer">
        Import CSV
      </button>
    </div>
  );
}
