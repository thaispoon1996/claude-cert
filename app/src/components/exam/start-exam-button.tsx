"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StartExamButtonProps {
  mode: "full" | "mini";
  domainId?: string;
  size?: "sm" | "md" | "lg";
}

export function StartExamButton({ mode, domainId, size = "md" }: StartExamButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/mock-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, domainFilter: domainId }),
      });
      const data = await res.json();
      router.push(`/exam/${data.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleStart} disabled={loading} size={size}>
      {loading ? "Đang bắt đầu..." : "Bắt đầu"}
    </Button>
  );
}
