"use client";

import { useState } from "react";
import LoginCard from "./LoginCard";
import SignupCard from "./SignupCard";

export default function AuthPanel() {
  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <div className="w-full max-w-md">
      {/* Tab toggle */}
      <div className="flex rounded-lg border border-gray-200 p-1 mb-8 bg-gray-50">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition cursor-pointer ${
            tab === "login"
              ? "bg-white text-[#2a1311] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition cursor-pointer ${
            tab === "signup"
              ? "bg-white text-[#2a1311] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Create account
        </button>
      </div>

      {tab === "login" ? <LoginCard /> : <SignupCard />}
    </div>
  );
}
