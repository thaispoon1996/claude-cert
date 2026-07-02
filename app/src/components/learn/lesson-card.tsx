import Link from "next/link";
import { CheckCircle, BookOpen, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  id: string;
  title: string;
  titleVi: string;
  summary: string;
  status?: string;
  domainId: string;
  subdomainId: string;
  order: number;
}

export function LessonCard({ id, title, titleVi, summary, status, domainId, subdomainId, order }: LessonCardProps) {
  const isCompleted = status === "completed";
  const isInProgress = status === "reading";

  return (
    <Link
      href={`/learn/${domainId}/${subdomainId}?lesson=${id}`}
      className={cn(
        "block p-4 rounded-lg border transition-all hover:shadow-md",
        isCompleted
          ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
          : isInProgress
          ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : isInProgress ? (
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Lock className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">Bài {order}</span>
          </div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{titleVi}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{summary}</p>
        </div>
      </div>
    </Link>
  );
}
