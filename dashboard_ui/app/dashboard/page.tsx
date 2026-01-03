import ClinicsTable from "./components/ClinicsTable";
import { mockClinicTable } from "@/mock/mock-chart";

export default function Dashboard() {
  return (
    <div className="!p-4 !text-sm flex min-h-screen items-center justify-center">
      <ClinicsTable clinicsInfo={mockClinicTable} />
    </div>
  );
}
