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
    <form
      id="login-form"
      onSubmit={handleSubmit}
      className="bg-white p-10 rounded-xl shadow-xl border border-gray-200 w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Outreach Dashboard</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-center font-medium">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label 
        id="username"
        className="block mb-2 font-medium text-gray-700">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label 
        id="password"
        className="block mb-2 font-medium text-gray-700">Password</label>
        <input
        id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`cursor-pointer w-full bg-blue-600 text-white p-3 rounded-lg font-semibold transition ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
