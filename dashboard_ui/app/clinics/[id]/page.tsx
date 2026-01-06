import ClinicDetailUI from "./components/ClinicDetailUI";
import { mockClinicsData } from "@/mock/dashboard-data";
import { Clinic } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function ClinicDetailPage({ params }: Props) {
  const { id } = await params;
  const clinic: Clinic = mockClinicsData[Number(id)];

  if (!clinic) {
    return <div>Clinic not found</div>;
  }

  return <ClinicDetailUI clinic={clinic} />;
}
