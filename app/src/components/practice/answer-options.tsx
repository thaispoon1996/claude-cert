"use client";

import { cn } from "@/lib/utils";

interface AnswerOptionsProps {
  options: {
    key: "A" | "B" | "C" | "D";
    text: string;
  }[];
  selected: string | null;
  correctAnswer?: string;
  revealed?: boolean;
  onSelect: (key: string) => void;
  disabled?: boolean;
}

export function AnswerOptions({
  options,
  selected,
  correctAnswer,
  revealed = false,
  onSelect,
  disabled = false,
}: AnswerOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map(({ key, text }) => {
        const isSelected = selected === key;
        const isCorrect = revealed && correctAnswer === key;
        const isWrong = revealed && isSelected && !isCorrect;

        return (
          <button
            key={key}
            onClick={() => !disabled && onSelect(key)}
            disabled={disabled}
            className={cn(
              "w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              !revealed && !isSelected && "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950",
              !revealed && isSelected && "border-indigo-500 bg-indigo-50 dark:bg-indigo-950",
              revealed && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
              revealed && isWrong && "border-red-500 bg-red-50 dark:bg-red-950",
              revealed && !isCorrect && !isWrong && "border-slate-200 dark:border-slate-700 opacity-60",
              disabled && "cursor-default"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2",
                !revealed && !isSelected && "border-slate-300 text-slate-500",
                !revealed && isSelected && "border-indigo-500 bg-indigo-500 text-white",
                revealed && isCorrect && "border-green-500 bg-green-500 text-white",
                revealed && isWrong && "border-red-500 bg-red-500 text-white",
                revealed && !isCorrect && !isWrong && "border-slate-300 text-slate-400"
              )}
            >
              {key}
            </span>
            <span className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">{text}</span>
          </button>
        );
      })}
    </div>
  );
}
