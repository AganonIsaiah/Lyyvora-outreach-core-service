"use client";

import ClinicsTable from "./table/ClinicsTable";
import ClinicsFilters from "./table/filters/ClinicsFilters";
import TableHeader from "./table/TableHeader";
import CampaignOutreach from "./CampaignOutreach";
import PipelineMetrics from "./metrics/PipelineMetrics";
import ImportCard from "./csv_buttons/ImportCard";
import DropTableCard from "./csv_buttons/DropTablesCard";
import Header from "./Header";
import { DashboardProvider, useDashboardContext } from "@/context/DashboardContext";
import Loading from "../loading";

function DashboardContent() {
  const { loadingPage } = useDashboardContext();

  if (loadingPage) return <Loading />;

  return (
    <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
      <Header />

      <div className="w-full! flex justify-center">
        <div className="m-1! p-4 flex flex-col gap-8 max-w-360!">
          <div className="flex justify-between gap-10">
            <div className="flex flex-col gap-6">
              <PipelineMetrics />
              <ImportCard />
              <DropTableCard />
            </div>
            <div className="flex flex-1!">
              <CampaignOutreach />
            </div>
          </div>

          <div className="flex flex-col">
            <TableHeader />
            <ClinicsFilters />
            <ClinicsTable />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
