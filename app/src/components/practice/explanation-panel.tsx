import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  explanationCorrect: string;
  explanationA: string;
  explanationB: string;
  explanationC: string;
  explanationD: string;
}

export function ExplanationPanel({
  isCorrect,
  selectedAnswer,
  correctAnswer,
  explanationCorrect,
  explanationA,
  explanationB,
  explanationC,
  explanationD,
}: ExplanationPanelProps) {
  const explanations: Record<string, string> = {
    A: explanationA,
    B: explanationB,
    C: explanationC,
    D: explanationD,
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Result banner */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-4",
          isCorrect
            ? "bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800"
        )}
      >
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        )}
        <div>
          <p className={cn("font-semibold", isCorrect ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200")}>
            {isCorrect ? "Chính xác!" : `Chưa đúng — Đáp án đúng: ${correctAnswer}`}
          </p>
          <p className="text-sm mt-0.5 text-slate-600 dark:text-slate-400">{explanationCorrect}</p>
        </div>
      </div>

      {/* Option explanations */}
      <div className="bg-white dark:bg-slate-800 p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Giải thích từng lựa chọn</p>
        {(["A", "B", "C", "D"] as const).map((key) => (
          <div
            key={key}
            className={cn(
              "flex gap-3 p-3 rounded-lg text-sm",
              key === correctAnswer && "bg-green-50 dark:bg-green-950",
              key === selectedAnswer && key !== correctAnswer && "bg-red-50 dark:bg-red-950"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                key === correctAnswer
                  ? "bg-green-500 text-white"
                  : key === selectedAnswer
                  ? "bg-red-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              )}
            >
              {key}
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{explanations[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
