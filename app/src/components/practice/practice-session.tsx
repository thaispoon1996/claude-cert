"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "./question-card";
import { AnswerOptions } from "./answer-options";
import { ExplanationPanel } from "./explanation-panel";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

interface QuestionData {
  id: string;
  scenario: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanationCorrect: string;
  explanationA: string;
  explanationB: string;
  explanationC: string;
  explanationD: string;
  difficulty: string;
  subdomain: {
    name: string;
    domain: { name: string; number: number };
  };
}

interface AttemptResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanationCorrect: string;
  explanationA: string;
  explanationB: string;
  explanationC: string;
  explanationD: string;
}

interface PracticeSessionProps {
  mode: string;
  domainId?: string;
  limit: number;
}

const confidenceLabel: Record<"sure" | "unsure" | "guess", string> = {
  sure: "Chắc chắn",
  unsure: "Không chắc",
  guess: "Đoán",
};

export function PracticeSession({ mode, domainId, limit }: PracticeSessionProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"sure" | "unsure" | "guess">("unsure");
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ mode, limit: String(limit) });
    if (domainId) params.set("domainId", domainId);

    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      });
  }, [mode, domainId, limit]);

  const currentQuestion = questions[currentIndex];

  async function handleSubmit() {
    if (!selectedAnswer || !currentQuestion) return;
    setSubmitting(true);

    const res = await fetch(`/api/questions/${currentQuestion.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedAnswer, confidence, context: "practice" }),
    });
    const data = await res.json();
    setResult(data);
    setRevealed(true);
    setScore((prev) => ({ correct: prev.correct + (data.isCorrect ? 1 : 0), total: prev.total + 1 }));
    setSubmitting(false);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer(null);
    setConfidence("unsure");
    setRevealed(false);
    setResult(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Đang tải câu hỏi...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-500">Không tìm thấy câu hỏi cho chế độ này.</p>
        <Link href="/practice">
          <Button variant="outline">Quay lại Luyện tập</Button>
        </Link>
      </div>
    );
  }

  if (finished) {
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hoàn thành phiên luyện tập!</h2>
          <p className="text-slate-500 mt-1">Bạn đã làm {score.total} câu hỏi</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Số câu đúng</span>
            <span className="font-semibold text-green-600">{score.correct}/{score.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Độ chính xác</span>
            <span className="font-semibold">{accuracy}%</span>
          </div>
          <ProgressBar value={accuracy} color={accuracy >= 70 ? "bg-green-500" : "bg-orange-500"} />
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/practice">
            <Button variant="outline">Quay lại Luyện tập</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Xem Tổng quan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Link href="/practice">
          <Button variant="ghost" size="sm">← Quay lại</Button>
        </Link>
        <ProgressBar
          value={Math.round((currentIndex / questions.length) * 100)}
          showPercent={false}
          className="flex-1 mx-4"
        />
        <span className="text-sm text-slate-500">
          {score.correct}/{score.total} đúng
        </span>
      </div>

      {/* Question */}
      <QuestionCard
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        scenario={currentQuestion.scenario}
        stem={currentQuestion.stem}
        difficulty={currentQuestion.difficulty}
        domainName={currentQuestion.subdomain?.domain?.name}
        subdomainName={currentQuestion.subdomain?.name}
      />

      {/* Answers */}
      <AnswerOptions
        options={[
          { key: "A", text: currentQuestion.optionA },
          { key: "B", text: currentQuestion.optionB },
          { key: "C", text: currentQuestion.optionC },
          { key: "D", text: currentQuestion.optionD },
        ]}
        selected={selectedAnswer}
        correctAnswer={revealed ? currentQuestion.correctAnswer : undefined}
        revealed={revealed}
        onSelect={setSelectedAnswer}
        disabled={revealed}
      />

      {/* Confidence selector */}
      {!revealed && (
        <div className="flex gap-2">
          <p className="text-sm text-slate-500 mr-2 flex items-center">Độ tự tin:</p>
          {(["sure", "unsure", "guess"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setConfidence(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                confidence === c
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
              }`}
            >
              {confidenceLabel[c]}
            </button>
          ))}
        </div>
      )}

      {/* Submit / Next */}
      {!revealed ? (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Đang gửi..." : "Gửi đáp án"}
        </Button>
      ) : (
        <div className="space-y-4">
          {result && (
            <ExplanationPanel
              isCorrect={result.isCorrect}
              selectedAnswer={selectedAnswer!}
              correctAnswer={result.correctAnswer}
              explanationCorrect={result.explanationCorrect}
              explanationA={result.explanationA}
              explanationB={result.explanationB}
              explanationC={result.explanationC}
              explanationD={result.explanationD}
            />
          )}
          <Button onClick={handleNext} className="w-full" size="lg">
            {currentIndex + 1 >= questions.length ? "Kết thúc phiên" : "Câu tiếp theo"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
