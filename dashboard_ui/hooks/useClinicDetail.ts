"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchClinicDetail,
  selectClinicDetail,
  selectClinicEmails,
} from "@/store/dashboardSlice";

export default function useClinicDetail(clinicId: string) {
  const dispatch = useAppDispatch();

  const clinic = useAppSelector(selectClinicDetail(clinicId));
  const emails = useAppSelector(selectClinicEmails(clinicId));
  const loading = useAppSelector((s) => s.dashboard.clinicDetailLoading);
  const error = useAppSelector((s) => s.dashboard.clinicDetailError);

  useEffect(() => {
    if (!clinicId) return;
    // fetchClinicDetail's condition skips the network call if already cached
    dispatch(fetchClinicDetail(clinicId));
  }, [clinicId, dispatch]);

  return { clinic, emails: emails ?? [], loading: clinic === null && !error, error };
}
