"use client";

import { ConfirmProvider } from "@/context/ConfirmContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
