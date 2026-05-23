"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboardContext } from "@/context/DashboardContext";
import { useConfirm } from "@/context/ConfirmContext";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL}`;

export const useGenerateOutreach = () => {
  const {
    campaignStatus,
    setCampaignStatus,
    notGeneratedEmailsCount,
    wsClinicsGenerated,
    setWsClinicsGenerated,
  } = useDashboardContext();
  const { notify, toast } = useConfirm();
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const startTimeRef = useRef<number | null>(null);
  // Animation refs — avoids stale closure issues inside setInterval
  const displayedRef = useRef<number>(0);
  const targetRef = useRef<number>(0);
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ANIM_DURATION_MS = 6000;

  const animateTo = (next: number) => {
    targetRef.current = next;
    if (animIntervalRef.current) return; // already draining
    const msPerStep = Math.max(80, ANIM_DURATION_MS / number_of_clinics);
    animIntervalRef.current = setInterval(() => {
      if (displayedRef.current >= targetRef.current) {
        clearInterval(animIntervalRef.current!);
        animIntervalRef.current = null;
        return;
      }
      displayedRef.current += 1;
      setWsClinicsGenerated(displayedRef.current);
    }, msPerStep);
  };

  const stopAnimation = (finalValue: number) => {
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    displayedRef.current = finalValue;
    targetRef.current = finalValue;
    setWsClinicsGenerated(finalValue);
  };

  const safeCampaignStatus = campaignStatus ?? {
    max_word_limit: 120,
    number_of_clinics: 5,
    prompt: "",
    total_clinics: 0,
  };

  const { max_word_limit, number_of_clinics, prompt } = safeCampaignStatus;

  const updateStatus = (
    key: keyof typeof safeCampaignStatus,
    value: number | string,
  ) => {
    if (!campaignStatus) return;
    setCampaignStatus({ ...campaignStatus, [key]: value });
  };

  const handleGenerateOutreach = async () => {
    if (
      notGeneratedEmailsCount != null &&
      notGeneratedEmailsCount - number_of_clinics < 0
    ) {
      await notify("Invalid batch size", "The number of clinics exceeds the available limit.");
      return;
    }

    displayedRef.current = 0;
    targetRef.current = 0;
    setWsClinicsGenerated(0);
    setLoading(true);
    startTimeRef.current = performance.now();
    toast("Generation started", "Outreach generation is running. The progress bar will update as emails are generated.");

    try {
      const response = await fetch(`${BASE_URL}/generate-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_batch_size: number_of_clinics,
          prompt: prompt,
          email_word_limit: max_word_limit,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to start outreach job");

      const data = await response.json();
      const wsUrl = `${WS_URL}/ws/outreach/${data.job_id}?token=${data.token}`;

      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "completed") {
          const maxVal = Math.min(number_of_clinics, notGeneratedEmailsCount ?? number_of_clinics);
          stopAnimation(maxVal);

          const seconds = startTimeRef.current
            ? ((performance.now() - startTimeRef.current) / 1000).toFixed(2)
            : null;

          await notify(
            "Generation complete",
            seconds
              ? `Outreach generation finished in ${seconds}s.`
              : "Outreach generation has finished."
          );

          setLoading(false);
          window.location.reload();
          return;
        }

        const increment = msg.contacted_clinics ?? 1;
        const cap = Math.min(number_of_clinics, notGeneratedEmailsCount ?? number_of_clinics);
        animateTo(Math.min(targetRef.current + increment, cap));
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setLoading(false);
      };
    } catch (err: any) {
      console.error(err.message);
      toast("Error", "Failed to start outreach generation. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, []);

  return {
    wsClinicsGenerated,
    loading,
    handleGenerateOutreach,
    updateStatus,
    max_word_limit,
    number_of_clinics,
    prompt,
  };
};
