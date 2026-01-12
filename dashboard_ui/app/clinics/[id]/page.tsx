"use client";

import ClinicDetailUI from "./components/ClinicDetailUI";
import { DashboardProvider } from "@/context/DashboardContext";
import { useParams } from "next/navigation";

function ClinicDetailInner() {
  const { id } = useParams();

  if (!id || Array.isArray(id)) return <div>Invalid clinic ID</div>;

  return <ClinicDetailUI clinicId={id} />;
}

export default function ClinicDetailPage() {
  return (
    <DashboardProvider>
      <ClinicDetailInner />
    </DashboardProvider>
  );
}
