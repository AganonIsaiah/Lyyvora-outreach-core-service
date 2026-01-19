import ClinicDetailUI from "./components/ClinicDetailUI";
import { DashboardProvider } from "@/context/DashboardContext";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";


export default async function ClinicDetailPage({ params }: { params: Promise<{ id: string }>}) {
  const user = await getCurrentUser();
  // if (!user) redirect("/login");

  const { id } = await params;
  if (!id ) return <div>Invalid clinic ID</div>;

  return (
    <DashboardProvider>
      <ClinicDetailUI clinicId={id} />
    </DashboardProvider>
  );
}
