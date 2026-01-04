import ClinicsTable from "./components/ClinicsTable";
import ClinicsFilters from "./components/filters/ClinicsFilters";

import { mockClinicTable } from "@/mock/dashboard-data";

export default function Dashboard() {
  return (
    <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
      <span className="separator flex justify-between items-center px-4!">
        <h1>Outreach Dashboard</h1>

        <span className="flex gap-4 mr-4">
          <button className="bg-blue-500 text-white px-2 py-1 rounded font-semibold cursor-pointer hover:bg-blue-600 transition-all duration-200">
            Import CSV
          </button>

          <button className="bg-teal-500 text-white px-2 py-1 rounded font-semibold cursor-pointer hover:bg-teal-600 transition-all duration-200">
            Export CSV
          </button>
        </span>
      </span>

      <div className="p-4 flex flex-col gap-4">
        <ClinicsFilters clinics={mockClinicTable} />
        <ClinicsTable clinicsInfo={mockClinicTable} />
      </div>
    </div>
  );
}
