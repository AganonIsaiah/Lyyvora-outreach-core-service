// app/clinics/[id]/page.tsx
"use client";

import ClinicDetailUI from "./components/ClinicDetailUI";
import { useDashboardContext, DashboardProvider } from "@/context/DashboardContext";
import { useParams } from "next/navigation";

function ClinicDetailInner() {
  const { id } = useParams();
  const { clinics } = useDashboardContext();

  const clinic = clinics.find((c) => c.id.toString() === id);

  if (!clinic) return <div>Clinic not found</div>;
  return <ClinicDetailUI clinic={clinic} />;
}

export default function ClinicDetailPage() {
  return (
    <DashboardProvider>
      <ClinicDetailInner />
    </DashboardProvider>
  );
}
