"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ACK_KEY = "pixelpassport.keyBackup.acknowledged";

export function KeyBackupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasKey = !!window.localStorage.getItem("pixelpassport.genlayer.privateKey");
    const acknowledged = window.localStorage.getItem(ACK_KEY) === "true";
    setShow(hasKey && !acknowledged);
  }, []);

  function dismiss() {
    window.localStorage.setItem(ACK_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="w-full px-4 py-2 text-sm flex items-center justify-center gap-3"
      style={{ background: "rgba(246,200,95,0.12)", color: "var(--passport-gold)", borderBottom: "1px solid rgba(246,200,95,0.2)" }}>
      <span>⚠ Back up your GenLayer key — clearing browser data without exporting will lock your passport.</span>
      <Link href="/account" className="underline font-semibold">Export now</Link>
      <button onClick={dismiss} className="ml-2 opacity-60 hover:opacity-100" aria-label="Dismiss">×</button>
    </div>
  );
}
