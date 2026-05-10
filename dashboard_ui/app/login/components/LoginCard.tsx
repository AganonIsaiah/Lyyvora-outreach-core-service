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
    <div className="w-full max-w-sm px-4">
      <form
        id="login-form"
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="text-xl font-semibold text-gray-900 tracking-tight">Outreach Dashboard</div>
          <p className="text-sm text-gray-400 mt-0.5">Sign in to your account</p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {error}
            </div>
          )}

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
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
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
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`cursor-pointer w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold transition mt-1 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-700"
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
