import ClinicsTable from "./components/ClinicsTable";
import ClinicsFilters from "./components/filters/ClinicsFilters";

import { mockClinicTable } from "@/mock/dashboard-data";

export default function Dashboard() {
  return (
    <div className="text-sm w-full flex flex-col min-h-screen">
      <h1></h1>      
      <div className="p-4">
        <ClinicsFilters clinics={mockClinicTable} />
        <ClinicsTable clinicsInfo={mockClinicTable} />
      </div>
    </div>
  );
}
