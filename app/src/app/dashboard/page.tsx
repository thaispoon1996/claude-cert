import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/dashboard/radar-chart";
import { getDomainColorClass, getDomainTextClass } from "@/lib/utils";
import Link from "next/link";
import { Brain, BookOpen, ClipboardList, Flame, Target, TrendingUp } from "lucide-react";

const DOMAIN_SHORT: Record<number, string> = {
  1: "Kiến trúc Agentic",
  2: "Tool & MCP",
  3: "Claude Code",
  4: "Prompt Engineering",
  5: "Context & Độ tin cậy",
};

async function getDashboardData(userId: string) {
  const domains = await prisma.domain.findMany({
    orderBy: { number: "asc" },
    include: {
      subdomains: {
        include: { questions: { select: { id: true } } },
      },
    },
  });

  const attempts = await prisma.attempt.findMany({
    where: { userId },
    include: {
      question: {
        include: { subdomain: { include: { domain: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Domain progress
  const domainProgress = domains.map((domain) => {
    const domainQIds = domain.subdomains.flatMap((s) => s.questions.map((q) => q.id));
    const domainAttempts = attempts.filter((a) => domainQIds.includes(a.questionId));
    const latestByQ = new Map<string, boolean>();
    for (const a of domainAttempts) {
      if (!latestByQ.has(a.questionId)) latestByQ.set(a.questionId, a.isCorrect);
    }
    const correct = Array.from(latestByQ.values()).filter(Boolean).length;
    const total = domainQIds.length;
    const mastery = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { domain, mastery, correct, total };
  });

  // Streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);
  while (true) {
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);
    const hasAttempt = attempts.some((a) => new Date(a.createdAt) >= checkDate && new Date(a.createdAt) <= dayEnd);
    if (!hasAttempt) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Weak spots
  const subdomainStats = new Map<string, { name: string; nameVi: string; domainNum: number; correct: number; total: number }>();
  for (const a of attempts) {
    const sid = a.question.subdomainId;
    const sub = a.question.subdomain;
    if (!subdomainStats.has(sid)) {
      subdomainStats.set(sid, {
        name: sub.name,
        nameVi: sub.nameVi,
        domainNum: (sub.domain as { number: number }).number,
        correct: 0,
        total: 0,
      });
    }
    const stat = subdomainStats.get(sid)!;
    stat.total++;
    if (a.isCorrect) stat.correct++;
  }

  const weakSpots = Array.from(subdomainStats.entries())
    .filter(([, s]) => s.total >= 3)
    .map(([id, s]) => ({ id, ...s, accuracy: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;

  return { domainProgress, streak, weakSpots, totalAnswered, totalCorrect };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const data = await getDashboardData(session.user.id);

  const radarData = data.domainProgress.map((dp) => ({
    domain: DOMAIN_SHORT[dp.domain.number] ?? dp.domain.name,
    mastery: dp.mastery,
  }));

  const daysToExam = user?.examDate
    ? Math.ceil((new Date(user.examDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Chào, {session.user.name?.split(" ")[0] ?? "bạn"} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {daysToExam !== null && daysToExam > 0
                ? `Còn ${daysToExam} ngày tới kỳ thi`
                : "Đặt ngày thi trong Hồ sơ để xem đếm ngược"}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-bold text-orange-700 dark:text-orange-300 text-lg leading-none">{data.streak}</p>
              <p className="text-xs text-orange-500">ngày liên tiếp</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-indigo-600">{data.totalAnswered}</p>
              <p className="text-xs text-slate-500 mt-1">Câu đã làm</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-green-600">
                {data.totalAnswered > 0 ? Math.round((data.totalCorrect / data.totalAnswered) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Độ chính xác</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-purple-600">
                {data.domainProgress.reduce((s, d) => s + d.mastery, 0) / 5 | 0}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Thành thạo TB</p>
            </CardContent>
          </Card>
        </div>

        {/* Radar chart + weak spots */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                Mức độ Thành thạo theo Domain
              </h2>
            </CardHeader>
            <CardContent>
              <RadarChart data={radarData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                Điểm yếu
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.weakSpots.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Luyện thêm câu hỏi để tìm ra điểm yếu của bạn!
                </p>
              ) : (
                data.weakSpots.map((spot) => (
                  <div key={spot.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{spot.nameVi}</p>
                        <p className="text-xs text-slate-400">{spot.name}</p>
                      </div>
                      <Badge
                        variant={spot.accuracy < 50 ? "danger" : spot.accuracy < 70 ? "warning" : "success"}
                        className="ml-2"
                      >
                        {spot.accuracy}%
                      </Badge>
                    </div>
                    <ProgressBar value={spot.accuracy} showPercent={false} color={spot.accuracy < 50 ? "bg-red-500" : spot.accuracy < 70 ? "bg-yellow-500" : "bg-green-500"} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Domain progress */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Tiến độ theo Domain</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.domainProgress.map((dp) => (
              <div key={dp.domain.id}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getDomainColorClass(dp.domain.number)}`}>
                    {dp.domain.number}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{dp.domain.nameVi}</p>
                    <p className="text-xs text-slate-400">{dp.domain.name} · {dp.domain.weight * 100 | 0}%</p>
                  </div>
                  <span className={`text-sm font-semibold ${getDomainTextClass(dp.domain.number)}`}>{dp.mastery}%</span>
                </div>
                <ProgressBar value={dp.mastery} showPercent={false} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/learn"
            className="flex items-center gap-3 p-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Tiếp tục học</p>
              <p className="text-xs text-indigo-200">Học bài & nội dung lý thuyết</p>
            </div>
          </Link>
          <Link
            href="/practice"
            className="flex items-center gap-3 p-4 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Brain className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Luyện tập câu hỏi</p>
              <p className="text-xs text-purple-200">Phiên luyện tập theo mục tiêu</p>
            </div>
          </Link>
          <Link
            href="/exam"
            className="flex items-center gap-3 p-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <ClipboardList className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Thi thử</p>
              <p className="text-xs text-green-200">Bài thi thử có giới hạn thời gian</p>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
