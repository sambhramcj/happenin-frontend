"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth" });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1a0b2e] border-b border-purple-900/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Happenin Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-pink-300 transition-all"
            >
              Happenin
            </button>
          </div>

          {/* Profile Button */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                {session?.user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-purple-200 text-sm font-medium hidden sm:block">
                {session?.user?.email?.split("@")[0] || "User"}
              </span>
              <svg
                className="w-4 h-4 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[#2d1b4e] border border-purple-500/30 shadow-xl z-20">
                  <div className="p-4 border-b border-purple-500/20">
                    <p className="text-sm font-medium text-purple-200">
                      {session?.user?.email}
                    </p>
                    <p className="text-xs text-purple-400 mt-1 capitalize">
                      {(session?.user as any)?.role || "user"}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 rounded-md text-purple-200 hover:bg-purple-600/30 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

