import ClinicsTable from "./components/ClinicsTable";
import ClinicsFilters from "./components/filters/ClinicsFilters";
import CampaignOutreach from "./components/CampaignOutreach";
import PipelineMetrics from "./components/metrics/PipelineMetrics";
import ImportCard from "./components/csv_buttons/ImportCard";

import { DashboardProvider } from "@/context/DashboardContext";

export default function Dashboard() {
  return (
    <DashboardProvider>
      <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
        <span className="separator flex justify-between items-center px-4!">
          <h1>Outreach Dashboard</h1>
        </span>

        <div className="w-full! flex justify-center">
          <div className="m-1! p-4 flex flex-col gap-8 max-w-330!">

            <div className="flex justify-between gap-10">
              <div className="flex flex-col gap-6">
                <PipelineMetrics />
                <ImportCard />
              </div>
              <div className="flex flex-1!">
                <CampaignOutreach />
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
      </div>
    </DashboardProvider>
  );
}
