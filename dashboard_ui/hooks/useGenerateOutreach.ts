"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboardContext } from "@/context/DashboardContext";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL}`;

export const useGenerateOutreach = () => {
  const {
    campaignStatus,
    setCampaignStatus,
    notGeneratedEmailsCount,
  } = useDashboardContext();

  const [wsClinicsGenerated, setWsClinicsGenerated] = useState(0);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

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
      alert("Number of clinics exceeds limit, outreach generation has failed!");
      return;
    }

    setWsClinicsGenerated(0);
    setLoading(true);
    alert("Outreach generation started!");

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
      const wsUrl = `${data.ws_url}?token=${data.token}`;

      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "completed") {
          alert("Outreach generation finished!");
          setLoading(false);
          window.location.reload();
          return;
        }

        const increment = msg.contacted_clinics ?? 1;

        setWsClinicsGenerated((prev) =>
          Math.min(
            prev + increment,
            number_of_clinics,
            notGeneratedEmailsCount ?? number_of_clinics,
          ),
        );
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
      alert("Failed to start outreach generation");
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
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