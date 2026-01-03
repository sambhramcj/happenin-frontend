"use client";

import { useState } from "react";

export default function Home() {
  const [msg, setMsg] = useState("");

  const checkBackend = async () => {
    const res = await fetch("https://happenin-backend.onrender.com/health");
    const text = await res.text();
    setMsg(text);
  };

  return (
    <main style={{ padding: 40 }}>
      <button onClick={checkBackend}>Check Backend</button>
      <p>{msg}</p>
    </main>
  );
}
