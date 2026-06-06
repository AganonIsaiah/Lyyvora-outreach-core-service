import ClinicDetailUI from "./components/ClinicDetailUI";

export default async function ClinicDetailPage({ params }: { params: Promise<{ id: string }>}) {

  const { id } = await params;
  if (!id) return <div>Invalid clinic ID</div>;

  return <ClinicDetailUI clinicId={id} />;
}
