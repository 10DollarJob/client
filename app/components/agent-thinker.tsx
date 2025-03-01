"use client"; // if you're using Next.js app directory

import { useState, useEffect } from "react";
// Shadcn's icons typically come from "lucide-react" under the hood
import { Loader2 } from "lucide-react";

interface SassyAgentLoaderProps {
  agentName?: string;
}

export function SassyAgentLoader({ agentName }: SassyAgentLoaderProps) {
  // Our rotating phrases
  const phrases = [
    agentName ? `${agentName} is thinking...` : "An agent is thinking...",
    "Almost there...",
    "Crunching the magic...",
    "Please hold tight...",
    "Working wonders...",
  ];

  // Track the current index
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle to the next phrase every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div
      className="
        bg-secondary
        p-4
        rounded-md
        mb-2
        flex
        items-center
        space-x-3
        w-[40%]
        h-fit   
      "
    >
      {/* Loader2 spinner from Lucide/Shadcn */}
      <Loader2 className="animate-spin text-black w-6 h-6" />

      {/* Pulsing text that updates every 3 seconds */}
      <p className="text-sm text-black animate-pulse">{phrases[phraseIndex]}</p>
    </div>
  );
}
