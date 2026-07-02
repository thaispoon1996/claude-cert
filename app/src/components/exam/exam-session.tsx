"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "@/components/ui/timer";
import { Button } from "@/components/ui/button";
import { AnswerOptions } from "@/components/practice/answer-options";
import { Flag, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  scenario: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
  subdomain: { name: string; domain: { name: string; number: number } };
}

interface ExamSessionProps {
  sessionId: string;
  questions: Question[];
  timeLimitSecs: number;
  mode: string;
}

export function ExamSession({ sessionId, questions, timeLimitSecs, mode }: ExamSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedAnswer: string; confidence: string }>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const isFlagged = flagged.has(currentQuestion?.id);

  function handleSelect(key: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { selectedAnswer: key, confidence: "unsure" },
    }));
  }

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    const timeSpentSec = Math.round((Date.now() - startTime) / 1000);

    try {
      await fetch(`/api/mock-exam/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeSpentSec }),
      });
      router.push(`/exam/${sessionId}/results`);
    } catch {
      setSubmitting(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const unanswered = questions.length - answeredCount;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {mode === "mini" ? "Thi thử mini" : "Thi thử đầy đủ"} · Câu {currentIndex + 1}/{questions.length}
          </span>
          <div className="text-sm text-slate-400">
            Đã trả lời {answeredCount}/{questions.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Timer totalSeconds={timeLimitSecs} onExpire={handleSubmit} className="text-base" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNav(!showNav)}
            className="text-xs"
          >
            Danh sách câu
          </Button>
        </div>
      </div>

      {/* Question navigator overlay */}
      {showNav && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Danh sách câu hỏi</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNav(false)}>Đóng</Button>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {questions.map((q, i) => {
                const answered = !!answers[q.id];
                const isFlaggedQ = flagged.has(q.id);
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(i); setShowNav(false); }}
                    className={cn(
                      "w-7 h-7 rounded text-xs font-medium flex items-center justify-center border transition-colors",
                      isCurrent && "ring-2 ring-indigo-500",
                      answered ? "bg-indigo-500 text-white border-indigo-500" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400",
                      isFlaggedQ && "border-yellow-400"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-500 rounded" /> Đã trả lời</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 border border-slate-300 rounded" /> Chưa trả lời</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-yellow-400 rounded" /> Đã đánh dấu</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Scenario */}
        {currentQuestion?.scenario && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 border-l-4 border-indigo-400 leading-relaxed">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">Tình huống</p>
            <p>{currentQuestion.scenario}</p>
          </div>
        )}

        {/* Question stem */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="font-medium text-slate-900 dark:text-slate-100 leading-relaxed flex-1">
              {currentQuestion?.stem}
            </p>
            <button
              onClick={toggleFlag}
              className={cn(
                "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                isFlagged
                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>

          <AnswerOptions
            options={[
              { key: "A", text: currentQuestion?.optionA ?? "" },
              { key: "B", text: currentQuestion?.optionB ?? "" },
              { key: "C", text: currentQuestion?.optionC ?? "" },
              { key: "D", text: currentQuestion?.optionD ?? "" },
            ]}
            selected={currentAnswer?.selectedAnswer ?? null}
            revealed={false}
            onSelect={handleSelect}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              Tiếp
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => {
                if (unanswered > 0) {
                  if (confirm(`Bạn còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`)) {
                    handleSubmit();
                  }
                } else {
                  handleSubmit();
                }
              }}
              disabled={submitting}
              variant="default"
            >
              {submitting ? "Đang nộp bài..." : "Nộp bài"}
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
