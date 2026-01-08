import ClinicsTable from "./components/ClinicsTable";
import ClinicsFilters from "./components/filters/ClinicsFilters";
import CampaignOutreach from "./components/CampaignOutreach";
import PipelineMetrics from "./components/metrics/PipelineMetrics";
import ExportCard from "./components/csv_buttons/ExportCard";
import ImportCard from "./components/csv_buttons/ImportCard";

import { DashboardProvider } from "@/context/DashboardContext";

export default function Dashboard() {

  return (
    <DashboardProvider>
      <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
        <span className="separator flex justify-between items-center px-4!">
          <h1>Outreach Dashboard</h1>
        </span>

        <div className="m-1! p-4 flex flex-col gap-8">
          <div className="flex justify-between gap-10">
            <CampaignOutreach />
            <div className="flex flex-col flex-1 gap-6">
              <PipelineMetrics />
              <ImportCard />
              <ExportCard />             
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="rounded-t-lg shadow-sm border border-gray-200 w-full flex items-center justify-center h-12">
              Clinic Table
            </h1>
            <ClinicsFilters />
            <ClinicsTable />
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}
