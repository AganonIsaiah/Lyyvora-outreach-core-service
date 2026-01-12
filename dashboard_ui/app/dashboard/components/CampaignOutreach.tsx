"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import EmergencyIcon from "@mui/icons-material/Emergency";
import { useState, useRef, useEffect } from "react";

export default function CampaignOutreach() {
  const { campaignStatus, setCampaignStatus, clinics, showExport } = useDashboardContext();
  const [wsClinicsGenerated, setWsClinicsGenerated] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const safeCampaignStatus = campaignStatus ?? {
    max_word_limit: 120,
    number_of_clinics: 5,
    prompt: "",
    total_clinics: 0,
  };

  const safeClinics = clinics ?? [];

  const { max_word_limit, number_of_clinics, prompt } = safeCampaignStatus;

  const updateStatus = (
    key: keyof typeof safeCampaignStatus,
    value: number | string
  ) => {
    if (!campaignStatus) return;
    setCampaignStatus({ ...campaignStatus, [key]: value });
  };

  const handleGenerateOutreach = async () => {
    if (!safeClinics.length) return;
    setWsClinicsGenerated(0);
    alert("Outreach generation started!");

    try {
      const response = await fetch("http://localhost:8000/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_batch_size: number_of_clinics,
          prompt,
          email_word_limit: max_word_limit,
        }),
      });

      if (!response.ok) throw new Error("Failed to start outreach job");

      const data = await response.json();
      const wsUrl = `ws://localhost:8000${data.ws_url}`;

      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "completed") {
          alert("Outreach generation finished!");
          window.location.reload();
          return;
        }
        const increment = msg.contacted_clinics ?? 1;
        setWsClinicsGenerated((prev) =>
          Math.min(prev + increment, number_of_clinics)
        );
      };

      ws.onclose = () => console.log("WebSocket closed");
      ws.onerror = (err) => console.error("WebSocket error:", err);
    } catch (err: any) {
      console.error(err.message);
      alert("Failed to start outreach generation");
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const percentage =
    number_of_clinics > 0
      ? Math.min((wsClinicsGenerated / number_of_clinics) * 100, 100)
      : 0;

  if (!showExport) {
    return (
      <div className="flex flex-col gap-4 w-full h-full card-section">
        <div className="text-gray-500 text-sm">No campaign data available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-4 h-full! w-full! card-section">
      <div className="flex justify-between gap-10">
        <div className="flex flex-col items-center justify-evenly">
          <span className="flex justify-between items-center">
            <span className="flex flex-col gap-0.25">
              <h2>Outreach Generator</h2>
              <p className="text-slate-400 text-xs flex gap-1 items-center">
                <EmergencyIcon className="text-[10px]!" />
                Adjust settings before generating email outreach
              </p>
            </span>
          </span>

          <span className="flex flex-col">
            <label htmlFor="max-word-limit" className="label-outreach">
              Max Word Limit
            </label>
            <input
              type="number"
              id="max-word-limit"
              className="input-outreach"
              value={max_word_limit ?? 0}
              onChange={(e) =>
                updateStatus(
                  "max_word_limit",
                  isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value)
                )
              }
            />
          </span>

          <span className="flex flex-col">
            <label htmlFor="number-of-clinics" className="label-outreach">
              Number of Clinics
            </label>
            <input
              type="number"
              id="number-of-clinics"
              className="input-outreach"
              value={number_of_clinics ?? 0}
              onChange={(e) =>
                updateStatus(
                  "number_of_clinics",
                  isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value)
                )
              }
            />
          </span>

          <button
            className="bg-indigo-500! text-white font-semibold rounded px-2 py-1 h-8! cursor-pointer hover:bg-indigo-600! transition-all duration-200"
            onClick={handleGenerateOutreach}
          >
            Generate Outreach
          </button>
        </div>

        <div className="flex flex-col flex-1">
          <label htmlFor="prompt" className="label-outreach">
            Prompt Template
          </label>
          <textarea
            id="prompt"
            className="resize-none! input-outreach border w-full! min-h-85! border-gray-300 rounded px-2 py-1"
            value={prompt ?? ""}
            onChange={(e) =>
              updateStatus(
                "prompt",
                e.target.value.replace(/[\t\r\n]+/g, " ").trim()
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-500">Campaign Progress</p>
        <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500">
          {wsClinicsGenerated} of {number_of_clinics} clinics contacted (
          {Math.round(percentage)}%)
        </span>
      </div>
    </div>
  );
}
