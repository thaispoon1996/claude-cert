import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatScore, getDomainColorClass } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default async function ExamResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { sessionId } = await params;

  const examSession = await prisma.mockExamSession.findUnique({
    where: { id: sessionId },
    include: {
      attempts: {
        include: {
          question: {
            include: { subdomain: { include: { domain: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!examSession || examSession.userId !== session.user.id) notFound();
  if (!examSession.finishedAt) redirect(`/exam/${sessionId}`);

  const questionIds: string[] = JSON.parse(examSession.questionIds);

  // Domain breakdown
  let domainScores: Record<string, { correct: number; total: number; percent: number; domainNumber: number }> = {};
  if (examSession.domainScores) {
    try {
      domainScores = JSON.parse(examSession.domainScores);
    } catch { /* empty */ }
  }

  const domains = await prisma.domain.findMany({
    where: { id: { in: Object.keys(domainScores) } },
    orderBy: { number: "asc" },
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/exam">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Kết quả thi</h1>
        </div>

        {/* Score card */}
        <Card className={`border-2 ${examSession.passed ? "border-green-300 dark:border-green-700" : "border-red-300 dark:border-red-700"}`}>
          <CardContent className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              {examSession.passed ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 dark:text-slate-100">
                {examSession.scaledScore !== null ? formatScore(examSession.scaledScore) : "--"}
              </p>
              <Badge
                variant={examSession.passed ? "success" : "danger"}
                className="mt-2 text-sm px-4 py-1"
              >
                {examSession.passed ? "ĐẠT" : "CHƯA ĐẠT"}
              </Badge>
            </div>
            <div className="flex justify-center gap-6 text-sm text-slate-500">
              <span>Đúng {examSession.rawScore ?? 0}/{questionIds.length} câu</span>
              {examSession.timeSpentSec && (
                <span>{Math.floor(examSession.timeSpentSec / 60)} phút {examSession.timeSpentSec % 60} giây</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Ngưỡng đạt: 700/1000</p>
          </CardContent>
        </Card>

        {/* Domain breakdown */}
        {Object.keys(domainScores).length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Phân tích theo Domain</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {domains.map((domain) => {
                const score = domainScores[domain.id];
                if (!score) return null;
                return (
                  <div key={domain.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getDomainColorClass(domain.number)}`}>
                        {domain.number}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{domain.nameVi}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {score.correct}/{score.total} ({score.percent}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={score.percent}
                      showPercent={false}
                      color={score.percent >= 70 ? "bg-green-500" : score.percent >= 50 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Review answers */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Xem lại đáp án</h2>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-700 py-0">
            {questionIds.map((qid, idx) => {
              const attempt = examSession.attempts.find((a) => a.questionId === qid);
              if (!attempt) return null;
              const q = attempt.question;
              return (
                <div key={qid} className="py-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 text-xs text-slate-400 mt-1 w-5">Q{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{q.stem}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold ${attempt.isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {attempt.isCorrect ? "Đúng" : `Sai (đáp án đúng: ${q.correctAnswer})`}
                        </span>
                        <span className="text-xs text-slate-400">Bạn chọn: {attempt.selectedAnswer}</span>
                      </div>
                      {!attempt.isCorrect && (
                        <p className="text-xs text-slate-500 mt-1">{q.explanationCorrect}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/exam" className="flex-1">
            <Button variant="outline" className="w-full">Thi thử mới</Button>
          </Link>
          <Link href="/practice" className="flex-1">
            <Button className="w-full">Luyện tập điểm yếu</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
