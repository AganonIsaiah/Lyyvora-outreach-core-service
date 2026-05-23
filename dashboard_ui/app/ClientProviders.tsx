"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { DashboardProvider } from "@/context/DashboardContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ConfirmProvider>
        <DashboardProvider>{children}</DashboardProvider>
      </ConfirmProvider>
    </Provider>
  );
}
