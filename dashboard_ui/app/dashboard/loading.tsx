export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-indigo-500 animate-spin" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}