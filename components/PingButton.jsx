"use client";

import { useState } from "react";
import { useSocket } from "@/lib/useSocket";

// Temporary: checks the WebSocket connection to the backend.
export default function PingButton() {
  const { status, request } = useSocket();
  const [result, setResult] = useState(null);

  async function handleClick() {
    setResult("…");
    try {
      setResult(await request("ping"));
    } catch (err) {
      setResult(`Error: ${err.message}`);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="rounded-2xl bg-itpb-orange px-6 py-3 font-bold text-white shadow-md transition hover:brightness-110 active:scale-95"
      >
        Ping
      </button>
      <p className="text-sm font-medium text-itpb-navy/70">Socket: {status}</p>
      {result && <p className="text-sm font-bold text-itpb-navy">{result}</p>}
    </div>
  );
}
