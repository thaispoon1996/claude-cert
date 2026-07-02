import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getDomainColorClass } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function LearnPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const domains = await prisma.domain.findMany({
    orderBy: { number: "asc" },
    include: {
      subdomains: {
        orderBy: { number: "asc" },
        include: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  // Get user lesson progress
  const lessonIds = domains.flatMap((d) => d.subdomains.flatMap((s) => s.lessons.map((l) => l.id)));
  const progressRecords = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lessonId: { in: lessonIds } },
  });
  const progressMap = new Map(progressRecords.map((p) => [p.lessonId, p.status] as [string, string]));

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Lộ trình học</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Chinh phục cả 5 domain của chứng chỉ CCA-F
          </p>
        </div>

        {domains.map((domain) => {
          const totalLessons = domain.subdomains.reduce((s: number, sub) => s + sub.lessons.length, 0);
          const completedLessons = domain.subdomains
            .flatMap((s) => s.lessons)
            .filter((l) => progressMap.get(l.id) === "completed").length;
          const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return (
            <Card key={domain.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getDomainColorClass(domain.number)}`}>
                    {domain.number}
                  </span>
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">{domain.nameVi}</h2>
                    <p className="text-xs text-slate-500">{domain.name} · {domain.weight * 100 | 0}% trọng số đề thi</p>
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {completedLessons}/{totalLessons}
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={progressPct} showPercent={false} />
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 dark:divide-slate-700 py-0">
                {domain.subdomains.map((subdomain) => (
                  <Link
                    key={subdomain.id}
                    href={`/learn/${domain.id}/${subdomain.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-6 px-6 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{subdomain.nameVi}</p>
                      <p className="text-xs text-slate-400">{subdomain.number} · {subdomain.lessons.length} bài học</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
