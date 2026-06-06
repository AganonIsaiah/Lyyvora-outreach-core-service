"use client";

import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";

export default function LoginCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { handleLogin, loading, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username.trim(), password.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your Outreach account.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="block mb-1.5 text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`cursor-pointer w-full bg-[#2a1311] text-[#f3ece0] py-2.5 rounded-lg text-sm font-semibold transition ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#5e261e]"
        }`}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
