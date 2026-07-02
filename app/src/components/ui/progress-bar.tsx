import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, label, showPercent = true, color = "bg-indigo-600", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>}
          {showPercent && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{clamped}%</span>}
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-500", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
