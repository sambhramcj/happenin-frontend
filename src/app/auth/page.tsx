"use client";

import { signIn, getProviders } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "organizer">("student");
  const [hasApple, setHasApple] = useState(false);

  // Force light mode for auth page - MUST be first useEffect
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "organizer") {
      setRole("organizer");
    }
    // Reset loading state when component mounts or returns from OAuth
    setIsLoading(false);
    setError(null);
  }, [searchParams]);

  // Also reset loading when user navigates back to auth page
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("User navigated back to auth page");
        setIsLoading(false);
        setError(null);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    // Detect configured OAuth providers to conditionally show Apple button
    getProviders().then((prov) => {
      setHasApple(Boolean(prov?.apple));
    }).catch(() => {
      setHasApple(false);
    });
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn("google", { redirect: false, callbackUrl: "/dashboard" });
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If successful, signIn will redirect automatically
    } catch (err) {
      setError("Google login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn("apple", { redirect: false, callbackUrl: "/dashboard" });
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // If successful, signIn will redirect automatically
    } catch (err) {
      setError("Apple login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNewUser) {
      // New user - create account first
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to create account");
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    // Login (works for both existing and just-created users)
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header */}
          <div className="text-center pt-8 pb-6 px-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">
              Happenin
            </h1>
            <p className="text-gray-600 text-sm">Login to continue</p>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google Login - Primary */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 mb-6 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 border border-gray-300 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? "Please wait..." : "Continue with Google"}
            </button>

            {/* Apple Login - Shown only if configured */}
            {hasApple && (
              <button
                onClick={handleAppleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 mb-6 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition-colors disabled:opacity-50 border border-black shadow-sm"
              >
                {/* Simple Apple logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M16.365 1.43c0 1.14-.47 2.244-1.223 3.064-.78.848-2.06 1.5-3.25 1.41-.09-1.08.52-2.205 1.27-3.005.81-.88 2.2-1.52 3.203-1.47zM19.7 12.87c-.06-3.07 2.51-4.54 2.63-4.61-1.44-2.11-3.68-2.4-4.47-2.43-1.9-.19-3.71 1.12-4.68 1.12-.98 0-2.46-1.1-4.04-1.07-2.07.03-3.98 1.2-5.04 3.04-2.15 3.73-.55 9.23 1.53 12.26 1.02 1.47 2.24 3.13 3.84 3.07 1.54-.06 2.12-.99 3.98-.99 1.86 0 2.39.99 4.04.96 1.68-.03 2.74-1.49 3.74-2.97 1.18-1.73 1.67-3.41 1.69-3.49-.04-.02-3.24-1.22-3.21-4.79z"/>
                </svg>
                {isLoading ? "Please wait..." : "Continue with Apple"}
              </button>
            )}

            {/* OR Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>

              {isNewUser && (
                <>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      I am a
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as "student" | "organizer")}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    >
                      <option value="student">Student</option>
                      <option value="organizer">Organizer</option>
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? "Please wait..." : "Login"}
              </button>
            </form>

            {/* New user toggle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsNewUser(!isNewUser)}
                className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
              >
                {isNewUser ? "Already have an account?" : "New user? Create account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
