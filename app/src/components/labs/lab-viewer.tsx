"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnswerOptions } from "@/components/practice/answer-options";
import { ExplanationPanel } from "@/components/practice/explanation-panel";
import { CheckCircle, Target, ListChecks } from "lucide-react";

interface LabStep {
  step: number;
  title: string;
  description: string;
  code?: string;
  expected?: string;
}

interface QuizItem {
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
}

interface Lab {
  id: string;
  title: string;
  titleVi: string;
  objective: string;
  prerequisites: string;
  steps: string;
  expectedOutput: string;
  challenge?: string | null;
  quizItems: string;
}

interface LabProgress {
  status: string;
  quizScore?: number | null;
}

interface LabViewerProps {
  lab: Lab;
  progress: LabProgress | null;
}

export function LabViewer({ lab, progress }: LabViewerProps) {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizRevealed, setQuizRevealed] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  let steps: LabStep[] = [];
  let quizItems: QuizItem[] = [];

  try { steps = JSON.parse(lab.steps); } catch { steps = []; }
  try { quizItems = JSON.parse(lab.quizItems); } catch { quizItems = []; }

  function toggleStep(stepNum: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) next.delete(stepNum);
      else next.add(stepNum);
      return next;
    });
  }

  async function handleComplete() {
    setSaving(true);
    const correct = quizItems.filter((q, i) => quizAnswers[i] === q.correct).length;
    const quizScore = quizItems.length > 0 ? Math.round((correct / quizItems.length) * 100) : null;

    await fetch(`/api/labs/${lab.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", quizScore }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {progress?.status === "completed" && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
            Lab completed{progress.quizScore !== null ? ` · Quiz score: ${progress.quizScore}%` : ""}
          </span>
        </div>
      )}

      {/* Objective */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Objective</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{lab.objective}</p>
            </div>
          </div>
          {lab.prerequisites && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 mb-1">Prerequisites</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{lab.prerequisites}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Steps ({completedSteps.size}/{steps.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => {
              const isDone = completedSteps.has(step.step);
              return (
                <div
                  key={step.step}
                  className={`rounded-lg border p-4 transition-colors ${
                    isDone ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30" : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStep(step.step)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 ${
                        isDone ? "border-green-500 bg-green-500" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isDone && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        Step {step.step}: {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{step.description}</p>
                      {step.code && (
                        <pre className="mt-3 bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono">
                          {step.code}
                        </pre>
                      )}
                      {step.expected && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-slate-500 mb-1">Expected output:</p>
                          <pre className="bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                            {step.expected}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Expected output */}
      {lab.expectedOutput && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Expected Output</h2>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {lab.expectedOutput}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Challenge */}
      {lab.challenge && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-2">
              <Badge variant="purple" className="flex-shrink-0">Challenge</Badge>
              <p className="text-sm text-slate-600 dark:text-slate-400">{lab.challenge}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {quizItems.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Knowledge Check</h2>
          </CardHeader>
          <CardContent className="space-y-8">
            {quizItems.map((q, idx) => (
              <div key={idx} className="space-y-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Q{idx + 1}: {q.question}</p>
                <AnswerOptions
                  options={q.options as { key: "A" | "B" | "C" | "D"; text: string }[]}
                  selected={quizAnswers[idx] ?? null}
                  correctAnswer={quizRevealed[idx] ? q.correct : undefined}
                  revealed={quizRevealed[idx]}
                  onSelect={(key) => {
                    if (quizRevealed[idx]) return;
                    setQuizAnswers((prev) => ({ ...prev, [idx]: key }));
                    setQuizRevealed((prev) => ({ ...prev, [idx]: true }));
                  }}
                  disabled={quizRevealed[idx]}
                />
                {quizRevealed[idx] && (
                  <div className={`p-3 rounded-lg text-sm ${quizAnswers[idx] === q.correct ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"}`}>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {progress?.status !== "completed" && (
        <Button onClick={handleComplete} disabled={saving} className="w-full" size="lg">
          {saving ? "Saving..." : "Mark Lab as Complete"}
        </Button>
      )}
    </div>
  );
}
