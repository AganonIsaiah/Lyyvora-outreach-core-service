"use client";

import { useState } from "react";
import ClinicsTable from "./table/ClinicsTable";
import ClinicsFilters from "./table/filters/ClinicsFilters";
import TableHeader from "./table/TableHeader";
import CampaignOutreach from "./CampaignOutreach";
import CampaignStats from "./CampaignStats";
import ImportCard from "./csv_buttons/ImportCard";
import DropTableCard from "./csv_buttons/DropTablesCard";
import Header from "./Header";
import { DashboardProvider, useDashboardContext } from "@/context/DashboardContext";
import Loading from "../loading";

function DashboardContent() {
  const { loadingPage, total } = useDashboardContext();
  const [columnsOpen, setColumnsOpen] = useState(false);

  if (loadingPage) return <Loading />;

  return (
    <div className="overflow-auto text-sm w-full flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="w-full flex justify-center">
        <div className="p-6 flex flex-col gap-6 w-full max-w-360!">

          {/* Campaign stats island */}
          <CampaignStats />

          {/* Generator + data management row */}
          <div className="flex gap-6 items-stretch">
            <CampaignOutreach />

            <div className="flex flex-col gap-4 w-72 shrink-0">
              <ImportCard onColumnsToggle={setColumnsOpen} />
              <DropTableCard />
              {!columnsOpen && (
                <div className="h-31 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                  <p className="pb-1! text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Total Clinics
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
                </div>
              )}
            </div>
          </div>

          {/* Clinic table */}
          <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
