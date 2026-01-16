import ClinicDetailUI from "./components/ClinicDetailUI";
import { DashboardProvider } from "@/context/DashboardContext";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

interface ClinicDetailPageProps {
  params: { id: string | string[] };
}

export default async function ClinicDetailPage({ params }: ClinicDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = params.id;
  if (!id || Array.isArray(id)) return <div>Invalid clinic ID</div>;

  return (
    <DashboardProvider>
      <ClinicDetailUI clinicId={id} />
    </DashboardProvider>
  );
}
