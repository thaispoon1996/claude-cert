"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnswerOptions } from "@/components/practice/answer-options";
import { ExplanationPanel } from "@/components/practice/explanation-panel";
import { CheckCircle, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { Lesson, LessonProgress, Question } from "@/types";

interface LessonViewerProps {
  lesson: Lesson & { quizItems: Question[] };
  lessons: { id: string; title: string; titleVi: string; order: number }[];
  progress: LessonProgress | null;
  userId: string;
  domainId: string;
  subdomainId: string;
}

export function LessonViewer({ lesson, lessons, progress, domainId, subdomainId }: LessonViewerProps) {
  const router = useRouter();
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizRevealed, setQuizRevealed] = useState<Record<string, boolean>>({});
  const [quizResults, setQuizResults] = useState<Record<string, { isCorrect: boolean; data: unknown }>>({});
  const [marking, setMarking] = useState(false);

  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];

  // Parse anti-patterns (stored as JSON string)
  let antiPatterns: { pattern: string; reason: string }[] = [];
  try {
    antiPatterns = JSON.parse(lesson.antiPatterns);
  } catch {
    antiPatterns = [];
  }

  async function handleAnswer(questionId: string, questionObj: Question, answer: string) {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
    const isCorrect = answer === questionObj.correctAnswer;

    try {
      const res = await fetch(`/api/questions/${questionId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedAnswer: answer, confidence: "unsure", context: "lesson_quiz" }),
      });
      const data = await res.json();
      setQuizResults((prev) => ({ ...prev, [questionId]: { isCorrect, data } }));
    } catch {
      setQuizResults((prev) => ({ ...prev, [questionId]: { isCorrect, data: null } }));
    }
    setQuizRevealed((prev) => ({ ...prev, [questionId]: true }));
  }

  async function markComplete() {
    setMarking(true);
    const totalQuiz = lesson.quizItems.length;
    const correct = Object.values(quizResults).filter((r) => r.isCorrect).length;
    const quizScore = totalQuiz > 0 ? Math.round((correct / totalQuiz) * 100) : null;

    await fetch(`/api/lessons/${lesson.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", quizScore }),
    });
    setMarking(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Lesson nav */}
      <div className="flex items-center justify-between">
        {prevLesson ? (
          <Link href={`/learn/${domainId}/${subdomainId}?lesson=${prevLesson.id}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
          </Link>
        ) : <div />}
        <div className="flex items-center gap-2">
          {progress?.status === "completed" && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Đã hoàn thành
            </Badge>
          )}
          <span className="text-sm text-slate-400">
            {currentIndex + 1} / {lessons.length}
          </span>
        </div>
        {nextLesson ? (
          <Link href={`/learn/${domainId}/${subdomainId}?lesson=${nextLesson.id}`}>
            <Button variant="ghost" size="sm">
              Tiếp
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        ) : <div />}
      </div>

      {/* Lesson content */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">{lesson.titleVi}</h2>
              <p className="text-sm text-slate-500">{lesson.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{lesson.summary}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, "<br/>") }}
          />
        </CardContent>
      </Card>

      {/* Anti-patterns table */}
      {antiPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-red-600 dark:text-red-400">Anti-pattern Cần Tránh</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 pr-4 font-medium text-slate-600 dark:text-slate-400">Pattern sai</th>
                    <th className="text-left py-2 font-medium text-slate-600 dark:text-slate-400">Vì sao sai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {antiPatterns.map((ap, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 text-red-600 dark:text-red-400 font-medium">{ap.pattern}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">{ap.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {lesson.quizItems.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Kiểm tra nhanh</h3>
            <p className="text-xs text-slate-400 mt-0.5">{lesson.quizItems.length} câu hỏi</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {lesson.quizItems.map((q, idx) => (
              <div key={q.id} className="space-y-4">
                <p className="text-sm font-medium text-slate-500">Q{idx + 1}</p>
                {q.scenario && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-400 border-l-4 border-indigo-400">
                    {q.scenario}
                  </div>
                )}
                <p className="text-slate-900 dark:text-slate-100 font-medium text-sm">{q.stem}</p>
                <AnswerOptions
                  options={[
                    { key: "A", text: q.optionA },
                    { key: "B", text: q.optionB },
                    { key: "C", text: q.optionC },
                    { key: "D", text: q.optionD },
                  ]}
                  selected={quizAnswers[q.id] ?? null}
                  correctAnswer={quizRevealed[q.id] ? q.correctAnswer : undefined}
                  revealed={quizRevealed[q.id]}
                  onSelect={(key) => !quizRevealed[q.id] && handleAnswer(q.id, q, key)}
                  disabled={quizRevealed[q.id]}
                />
                {quizRevealed[q.id] && (
                  <ExplanationPanel
                    isCorrect={quizResults[q.id]?.isCorrect ?? false}
                    selectedAnswer={quizAnswers[q.id]}
                    correctAnswer={q.correctAnswer}
                    explanationCorrect={q.explanationCorrect}
                    explanationA={q.explanationA}
                    explanationB={q.explanationB}
                    explanationC={q.explanationC}
                    explanationD={q.explanationD}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mark complete */}
      {progress?.status !== "completed" && (
        <Button onClick={markComplete} disabled={marking} className="w-full" size="lg">
          {marking ? "Đang lưu..." : "Đánh dấu hoàn thành"}
        </Button>
      )}
    </div>
  );
}
