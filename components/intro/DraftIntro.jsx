"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false });

const DRAFT_ROUTE = "/draft";
// If the 3D scene never reports back (e.g. WebGL unavailable), move on anyway.
const LAUNCH_TIMEOUT = 4000;
const EXIT_TIMEOUT = 1400;

export default function DraftIntro() {
  const router = useRouter();
  // intro → launching (swing, flight, shatter) → leaving (zoom into draft screen) → route to draft
  const [phase, setPhase] = useState("intro");

  useEffect(() => {
    router.prefetch(DRAFT_ROUTE);
  }, [router]);

  const launch = useCallback(() => {
    setPhase((p) => (p === "intro" ? "launching" : p));
  }, []);
  const reveal = useCallback(() => {
    setPhase((p) => (p === "launching" ? "leaving" : p));
  }, []);
  const finish = useCallback(() => setPhase("done"), []);

  useEffect(() => {
    if (phase === "launching") {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const id = setTimeout(reveal, reduceMotion ? 0 : LAUNCH_TIMEOUT);
      return () => clearTimeout(id);
    }
    if (phase === "leaving") {
      const id = setTimeout(finish, EXIT_TIMEOUT);
      return () => clearTimeout(id);
    }
    if (phase === "done") router.push(DRAFT_ROUTE);
  }, [phase, reveal, finish, router]);

  const leaving = phase === "leaving";

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-itpb-night">
      <IntroScene launched={phase !== "intro"} onLaunch={launch} onComplete={reveal} />

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 px-4 pt-10 text-center transition-opacity duration-500 ${
          phase === "intro" ? "" : "opacity-0"
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-itpb-orange">Singleplayer</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-itpb-chalk drop-shadow-lg sm:text-5xl">
          In The Park Baseball
        </h1>
      </div>

      <Link
        href="/"
        className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-itpb-chalk/60 transition hover:bg-white/10 hover:text-itpb-chalk ${
          phase === "intro" ? "" : "pointer-events-none opacity-0"
        }`}
      >
        ← Menu
      </Link>

      {/* The draft screen rushing up through the hole the ball punched */}
      {leaving && (
        <div
          onAnimationEnd={finish}
          className="pointer-events-none absolute inset-0 animate-zoom-through bg-itpb-chalk motion-reduce:animate-none"
        />
      )}
    </div>
  );
}
