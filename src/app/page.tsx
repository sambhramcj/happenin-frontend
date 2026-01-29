"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-white">
      {/* Header */}
      <header className="w-full sticky top-0 z-50 flex justify-between items-center px-6 py-5 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="text-2xl font-bold text-purple-600">
          Happenin
        </div>
        <button
          onClick={() => router.push("/auth")}
          className="px-6 py-2.5 text-gray-700 hover:text-purple-600 border border-gray-300 hover:border-purple-600 rounded-lg transition-all font-medium"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Discover & register for
          <br />
          <span className="text-purple-600">
            college events
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 font-medium">
          Workshops • Fests • Competitions • Cultural
        </p>

        <button
          onClick={() => router.push("/events")}
          className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
          Explore Events
        </button>
      </section>

      {/* Role Switch */}
      <section className="flex flex-col items-center px-6 py-16 max-w-4xl mx-auto text-center">
        <p className="text-gray-700 mb-5 text-lg">Are you an organizer?</p>
        <button
          onClick={() => router.push("/auth?role=organizer")}
          className="px-8 py-3.5 bg-white hover:bg-gray-50 text-purple-600 hover:text-purple-700 border-2 border-purple-600 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg"
        >
          Create & manage events
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-32">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <a href="#" className="hover:text-purple-600 transition-colors font-medium">About</a>
            <span className="text-gray-400">•</span>
            <a href="#" className="hover:text-purple-600 transition-colors font-medium">Privacy</a>
            <span className="text-gray-400">•</span>
            <a href="#" className="hover:text-purple-600 transition-colors font-medium">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
