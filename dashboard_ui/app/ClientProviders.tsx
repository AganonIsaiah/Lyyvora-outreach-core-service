"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMe, resetAuth, selectRole } from "@/store/authSlice";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { PUBLIC_ROUTES } from "@/lib/constants";

function AuthInitializer() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const role = useAppSelector(selectRole);

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      dispatch(resetAuth());
      return;
    }
    // Only fetch if role is unknown — covers page refresh while Redux is empty
    // fetchMe's condition skips the network call if role is already set
    dispatch(fetchMe());
  }, [pathname]);

  return null;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      <ConfirmProvider>
        <DashboardProvider>{children}</DashboardProvider>
      </ConfirmProvider>
    </Provider>
  );
}
