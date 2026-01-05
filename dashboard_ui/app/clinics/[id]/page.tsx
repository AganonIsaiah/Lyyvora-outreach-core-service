import { mockClinicsData} from "@/mock/dashboard-data";

/**
 * Needs: Interface to show all three emails from Email 1 to Follow-up 2 (maybe on left side)
 * 
 */
export default async function Clinic({ params }: { params: { id: string } }) {
  const { id } = await params;


  const clinic = mockClinicsData[Number(id)];
  

  return (
    <div className="overflow-auto text-sm w-full flex flex-col min-h-screen">
      <span className="separator flex justify-between items-center px-4!">
        <h1>{clinic.name} </h1>
      </span>
    </div>
  );
}
