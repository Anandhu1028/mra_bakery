"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";

export default function PageShell() {
  const [done, setDone] = useState(false);
  if (done) return null;
  return <Preloader heroReady={true} onComplete={() => setDone(true)} />;
}
