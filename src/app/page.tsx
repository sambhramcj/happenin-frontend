"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const checkBackend = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://happenin-backend.onrender.com/health");
      const text = await res.text();
      setMsg(text);
    } catch (error) {
      setMsg("Backend connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0519] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#2d1b4e] rounded-2xl shadow-xl p-8 border border-purple-500/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Happenin
          </h1>
          <p className="text-purple-300">Event Management Platform</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Go to Login
          </button>

          <div className="pt-4 border-t border-purple-500/20">
            <button
              onClick={checkBackend}
              disabled={isLoading}
              className="w-full bg-[#1a0b2e] text-purple-300 py-2.5 rounded-lg hover:bg-[#2d1b4e] border border-purple-500/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Checking..." : "Check Backend Health"}
            </button>
            {msg && (
              <div className="mt-3 p-3 bg-[#1a0b2e] rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-200 font-mono">{msg}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
