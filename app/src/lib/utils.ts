import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return `${score}/1000`;
}

export function getDomainColor(domainNumber: number): string {
  const colors: Record<number, string> = {
    1: "blue",
    2: "green",
    3: "purple",
    4: "orange",
    5: "red",
  };
  return colors[domainNumber] ?? "gray";
}

export function getDomainColorClass(domainNumber: number): string {
  const classes: Record<number, string> = {
    1: "bg-blue-500 text-white",
    2: "bg-green-500 text-white",
    3: "bg-purple-500 text-white",
    4: "bg-orange-500 text-white",
    5: "bg-red-500 text-white",
  };
  return classes[domainNumber] ?? "bg-gray-500 text-white";
}

export function getDomainBorderClass(domainNumber: number): string {
  const classes: Record<number, string> = {
    1: "border-blue-500",
    2: "border-green-500",
    3: "border-purple-500",
    4: "border-orange-500",
    5: "border-red-500",
  };
  return classes[domainNumber] ?? "border-gray-500";
}

export function getDomainTextClass(domainNumber: number): string {
  const classes: Record<number, string> = {
    1: "text-blue-600",
    2: "text-green-600",
    3: "text-purple-600",
    4: "text-orange-600",
    5: "text-red-600",
  };
  return classes[domainNumber] ?? "text-gray-600";
}

export function calculateScaledScore(correct: number, total: number): number {
  if (total === 0) return 0;
  const raw = correct / total;
  // Scale to 1000 with a passing threshold of 700 at ~72%
  return Math.round(raw * 1000);
}
