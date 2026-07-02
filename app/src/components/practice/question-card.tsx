import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  scenario: string;
  stem: string;
  difficulty: string;
  domainName?: string;
  subdomainName?: string;
}

const difficultyVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function QuestionCard({
  questionNumber,
  totalQuestions,
  scenario,
  stem,
  difficulty,
  domainName,
  subdomainName,
}: QuestionCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          {domainName && (
            <Badge variant="default" className="text-xs">
              {domainName}
            </Badge>
          )}
          <Badge variant={difficultyVariant[difficulty] ?? "default"} className="capitalize">
            {difficulty}
          </Badge>
        </div>
      </div>

      {/* Scenario */}
      {scenario && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-l-4 border-indigo-400">
          <p className="font-medium text-xs text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">Scenario</p>
          <p>{scenario}</p>
        </div>
      )}

      {/* Question stem */}
      <p className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed">{stem}</p>

      {subdomainName && (
        <p className="text-xs text-slate-400 mt-3">{subdomainName}</p>
      )}
    </div>
  );
}
