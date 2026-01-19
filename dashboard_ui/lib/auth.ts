export async function getCurrentUser() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
    credentials: "include", 
    cache: "no-store",
  });
  
  if (!res.ok) return null;
  const data = await res.json();
  return data.username; 
}
