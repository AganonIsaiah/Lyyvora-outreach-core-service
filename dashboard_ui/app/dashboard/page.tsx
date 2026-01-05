import ClinicsTable from "./components/ClinicsTable";
import ClinicsFilters from "./components/filters/ClinicsFilters";
import CampaignOutreach from "./components/CampaignOutreach";

import { mockClinicsData } from "@/mock/dashboard-data";

export default function Dashboard() {
  return (
    <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
      <span className="separator flex justify-between items-center px-4!">
        <h1>Outreach Dashboard</h1>
      </span>

      <div className="m-1! p-4 flex flex-col gap-8">
        {/* Pipeline metrics */}

        {/* Campaign outreach +  Recent Activity*/}
        <div className="flex">
          <CampaignOutreach />
        </div>

        <div className="flex flex-col">
          <h1 className="rounded-t-lg shadow-sm border border-gray-200 w-full flex items-center justify-center h-12">Clinic Table</h1>
          <ClinicsFilters clinics={mockClinicsData} />
          <ClinicsTable clinicsInfo={mockClinicsData} />
        </div>
      </div>
    </div>
  );
}
