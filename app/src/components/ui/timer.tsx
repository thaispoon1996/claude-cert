"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  totalSeconds: number;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ totalSeconds, onExpire, className }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 300; // < 5 minutes

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums",
        isLow ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300",
        className
      )}
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}
