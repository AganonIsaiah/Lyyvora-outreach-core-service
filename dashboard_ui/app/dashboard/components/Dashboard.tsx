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
import { useDashboardContext } from "@/context/DashboardContext";
import Loading from "../loading";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
      {children}
    </p>
  );
}

function DashboardContent() {
  const { loadingPage } = useDashboardContext();

  if (loadingPage) return <Loading />;

  return (
    <div className="text-sm w-full flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="w-full flex justify-center">
        <div className="p-6 flex flex-col gap-8 w-full max-w-360!">
          {/* Campaign metrics */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Campaign Overview</SectionLabel>
            <hr className="border-gray-300 mb-2" />
            <CampaignStats />
          </section>

          {/* Outreach generator + data management */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Outreach</SectionLabel>
            <hr className="border-gray-300 mb-2" />
            <div className="flex gap-6 items-stretch">
              <CampaignOutreach />
              <div className="flex flex-col gap-4 w-72 shrink-0">
                <ImportCard />
                <DropTableCard />
              </div>
            </div>
          </section>

          {/* Clinics table */}
          <section className="flex flex-col gap-3">
            <SectionLabel>Clinics</SectionLabel>
            <hr className="border-gray-300 mb-2" />
            <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <TableHeader />
              <ClinicsFilters />
              <ClinicsTable />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
