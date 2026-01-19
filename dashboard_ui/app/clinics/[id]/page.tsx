import ClinicDetailUI from "./components/ClinicDetailUI";
import { DashboardProvider } from "@/context/DashboardContext";

export default async function ClinicDetailPage({ params }: { params: Promise<{ id: string }>}) {
 
  const { id } = await params;
  if (!id ) return <div>Invalid clinic ID</div>;

  return (
    <DashboardProvider>
      <ClinicDetailUI clinicId={id} />
    </DashboardProvider>
  );
}
