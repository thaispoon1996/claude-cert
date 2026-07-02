"use client";

import { useState } from "react";
import Link from "next/link";
import { AnswerOptions } from "@/components/practice/answer-options";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDomainTextClass } from "@/lib/utils";

interface Question {
  id: string;
  scenario: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  difficulty: string;
  subdomain: { id: string; name: string; domain: { id: string; number: number; name: string; nameVi: string } };
}

interface DiagnosticSessionProps {
  questions: Question[];
}

interface DomainResult {
  domainId: string;
  domainNumber: number;
  domainName: string;
  domainNameVi: string;
  correct: number;
  total: number;
}

export function DiagnosticSession({ questions }: DiagnosticSessionProps) {
  const [phase, setPhase] = useState<"intro" | "quiz" | "results">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];

  function handleSelect(key: string) {
    if (answers[currentQuestion.id]) return;
    const isCorrect = key === currentQuestion.correctAnswer;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: key }));
    setResults((prev) => ({ ...prev, [currentQuestion.id]: isCorrect }));
  }

  async function handleNext() {
    if (!answers[currentQuestion.id]) return;

    // Submit attempt
    setSubmitting(true);
    try {
      await fetch(`/api/questions/${currentQuestion.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAnswer: answers[currentQuestion.id],
          confidence: "unsure",
          context: "diagnostic",
        }),
      });
    } catch { /* continue */ }
    setSubmitting(false);

    if (currentIndex + 1 >= questions.length) {
      setPhase("results");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (phase === "intro") {
    return (
      <div className="space-y-6 py-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-3xl">🎯</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Diagnostic Assessment</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            This {questions.length}-question diagnostic will identify your current knowledge level
            across all 5 CCA-F domains and recommend a personalized learning path.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left max-w-sm mx-auto">
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> {questions.length} carefully selected questions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Covers all 5 exam domains
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> ~15-20 minutes to complete
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Personalized study recommendations
            </li>
          </ul>
        </div>
        <Button size="lg" onClick={() => setPhase("quiz")}>
          Start Diagnostic
        </Button>
      </div>
    );
  }

  if (phase === "results") {
    // Aggregate by domain
    const domainMap = new Map<string, DomainResult>();
    for (const q of questions) {
      const d = q.subdomain.domain;
      if (!domainMap.has(d.id)) {
        domainMap.set(d.id, {
          domainId: d.id,
          domainNumber: d.number,
          domainName: d.name,
          domainNameVi: d.nameVi,
          correct: 0,
          total: 0,
        });
      }
      const entry = domainMap.get(d.id)!;
      entry.total++;
      if (results[q.id]) entry.correct++;
    }

    const domainResults = Array.from(domainMap.values()).sort((a, b) => a.domainNumber - b.domainNumber);
    const totalCorrect = Object.values(results).filter(Boolean).length;
    const overall = Math.round((totalCorrect / questions.length) * 100);

    const weakDomains = domainResults
      .filter((d) => d.total > 0 && Math.round((d.correct / d.total) * 100) < 60)
      .sort((a, b) => a.correct / a.total - b.correct / b.total);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Diagnostic Results</h1>

        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-5xl font-black text-indigo-600">{overall}%</p>
            <p className="text-slate-500 mt-1">Overall Score ({totalCorrect}/{questions.length} correct)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Domain Breakdown</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {domainResults.map((d) => {
              const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
              return (
                <div key={d.domainId}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm font-medium ${getDomainTextClass(d.domainNumber)}`}>
                      {d.domainNumber}. {d.domainNameVi}
                    </span>
                    <span className="text-sm text-slate-500">{d.correct}/{d.total}</span>
                  </div>
                  <ProgressBar
                    value={pct}
                    showPercent={false}
                    color={pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {weakDomains.length > 0 && (
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recommended Learning Path</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">Focus on these domains first:</p>
              {weakDomains.map((d) => (
                <Link
                  key={d.domainId}
                  href={`/learn`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Priority
                  </span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{d.domainNameVi}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {Math.round((d.correct / d.total) * 100)}%
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Link href="/learn" className="flex-1">
            <Button className="w-full">Start Learning</Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Quiz phase
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Diagnostic · Q{currentIndex + 1}/{questions.length}</span>
        <ProgressBar
          value={Math.round((currentIndex / questions.length) * 100)}
          showPercent={false}
          className="flex-1 mx-4"
        />
      </div>

      {currentQuestion.scenario && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300 border-l-4 border-indigo-400 leading-relaxed">
          <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">Scenario</p>
          {currentQuestion.scenario}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <p className="font-medium text-slate-900 dark:text-slate-100 mb-4 leading-relaxed">
          {currentQuestion.stem}
        </p>
        <AnswerOptions
          options={[
            { key: "A", text: currentQuestion.optionA },
            { key: "B", text: currentQuestion.optionB },
            { key: "C", text: currentQuestion.optionC },
            { key: "D", text: currentQuestion.optionD },
          ]}
          selected={answers[currentQuestion.id] ?? null}
          correctAnswer={answers[currentQuestion.id] ? currentQuestion.correctAnswer : undefined}
          revealed={!!answers[currentQuestion.id]}
          onSelect={handleSelect}
          disabled={!!answers[currentQuestion.id]}
        />
      </div>

      {answers[currentQuestion.id] && (
        <div className={`p-4 rounded-lg text-sm ${results[currentQuestion.id] ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"}`}>
          {currentQuestion.correctAnswer && `Correct answer: ${currentQuestion.correctAnswer}. `}
          {/* Brief explanation would go here from explanationCorrect */}
        </div>
      )}

      <Button
        onClick={handleNext}
        disabled={!answers[currentQuestion.id] || submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? "Saving..." : currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
      </Button>
    </div>
  );
}
