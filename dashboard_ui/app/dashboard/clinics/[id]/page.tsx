


export default function Clinic({ params }: { params: { id: number } }) {
  return (
    <div>
      <h1>Clinic Dashboard</h1>
      <p>Clinic ID: {params.id}</p>
    </div>
  );
}
