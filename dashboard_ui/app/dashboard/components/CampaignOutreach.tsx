"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import { useGenerateOutreach } from "@/hooks/useGenerateOutreach";

export default function CampaignOutreach() {
  const { showExport, notGeneratedEmailsCount } = useDashboardContext();

  const {
    handleGenerateOutreach,
    updateStatus,
    max_word_limit,
    number_of_clinics,
    prompt,
    loading,
  } = useGenerateOutreach();

  if (!showExport) {
    return (
      <div className="flex items-center justify-center w-full h-full card-section">
        <p className="text-gray-400 text-sm">No campaign data available</p>
      </div>
    );
  }

  return (
    <div className="card-section flex flex-col gap-5 flex-1 h-full">
      <div>
        <h2>Outreach Generator</h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Configure and generate personalized email outreach at scale
        </p>
      </div>

      <div className="flex gap-4">
        <span className="flex flex-col">
          <label htmlFor="max-word-limit" className="label-outreach text-xs!">
            Word Limit <span className="text-gray-400">(max 200)</span>
          </label>
          <input
            type="number"
            id="max-word-limit"
            className="input-outreach"
            max={200}
            value={max_word_limit ?? 0}
            onChange={(e) => {
              let value = parseInt(e.target.value);
              value = Math.min(Math.max(value, 1), 200);
              updateStatus("max_word_limit", value);
            }}
          />
        </span>

        <span className="flex flex-col">
          <label className="label-outreach text-xs!">
            Batch Size <span className="text-gray-400">(max 100)</span>
          </label>
          <div className="flex gap-2 h-10! items-center">
            {[1, 10, 25, 50, 100].map((size) => {
              const isSelected = number_of_clinics === size;
              const isDisabled = notGeneratedEmailsCount != null && size > notGeneratedEmailsCount;
              return (
                <button
                  key={size}
                  disabled={isDisabled}
                  onClick={() => updateStatus("number_of_clinics", isSelected ? 0 : size)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all duration-150 cursor-pointer
                    ${isSelected
                      ? "bg-indigo-500 text-white border-indigo-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </span>

        <span className="flex flex-col justify-end">
          <button
            className={`bg-indigo-500! text-white font-semibold rounded px-4 py-2 h-10! transition-all duration-200 ${
              loading || !max_word_limit || !number_of_clinics
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-indigo-600! cursor-pointer"
            }`}
            onClick={handleGenerateOutreach}
            disabled={loading || !max_word_limit || !number_of_clinics}
          >
            {loading ? "Generating..." : "Generate Outreach"}
          </button>
        </span>
      </div>

      <div className="flex flex-col flex-1">
        <label htmlFor="prompt" className="label-outreach text-xs!">
          Prompt Template
        </label>
        <textarea
          id="prompt"
          className="resize-none! input-outreach border w-full! flex-1 min-h-60! border-gray-300 rounded px-3 py-2"
          value={prompt ?? ""}
          onChange={(e) => updateStatus("prompt", e.target.value)}
        />
      </div>
    </div>
  );
}
