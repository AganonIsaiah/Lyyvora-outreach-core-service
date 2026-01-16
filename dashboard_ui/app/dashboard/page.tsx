import ClinicsTable from "./components/table/ClinicsTable";
import ClinicsFilters from "./components/table/filters/ClinicsFilters";
import TableHeader from "./components/table/TableHeader";
import CampaignOutreach from "./components/CampaignOutreach";
import PipelineMetrics from "./components/metrics/PipelineMetrics";
import ImportCard from "./components/csv_buttons/ImportCard";
import Header from "./components/Header";
import DropTableCard from "./components/csv_buttons/DropTablesCard";
import { DashboardProvider } from "@/context/DashboardContext";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardProvider>
      <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
        <Header />

        <div className="w-full! flex justify-center">
          <div className="m-1! p-4 flex flex-col gap-8 max-w-330!">
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
    </DashboardProvider>
  );
}
