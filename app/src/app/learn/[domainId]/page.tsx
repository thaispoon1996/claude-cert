import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDomainColorClass } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { domainId } = await params;

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    include: {
      subdomains: {
        orderBy: { number: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          _count: { select: { questions: true } },
        },
      },
    },
  });

  if (!domain) notFound();

  // Get lesson progress
  const lessonIds = domain.subdomains.flatMap((s) => s.lessons.map((l) => l.id));
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lessonId: { in: lessonIds } },
  });
  const progressMap = new Map(progress.map((p) => [p.lessonId, p.status]));

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/learn" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${getDomainColorClass(domain.number)}`}>
              {domain.number}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{domain.nameVi}</h1>
              <p className="text-sm text-slate-500">{domain.name}</p>
            </div>
          </div>
        </div>

        {domain.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            {domain.description}
          </p>
        )}

        <div className="space-y-4">
          {domain.subdomains.map((subdomain) => {
            const completedCount = subdomain.lessons.filter(
              (l) => progressMap.get(l.id) === "completed"
            ).length;

            return (
              <Card key={subdomain.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">{subdomain.number}</p>
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{subdomain.nameVi}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{subdomain.name}</p>
                    </div>
                    <span className="text-sm text-slate-400">{completedCount}/{subdomain.lessons.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{subdomain.focus}</p>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100 dark:divide-slate-700 py-0">
                  {subdomain.lessons.map((lesson) => {
                    const status = progressMap.get(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${domainId}/${subdomain.id}?lesson=${lesson.id}`}
                        className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 -mx-6 px-6 transition-colors"
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center text-xs ${
                            status === "completed"
                              ? "border-green-500 bg-green-500"
                              : status === "reading"
                              ? "border-indigo-500"
                              : "border-slate-300"
                          }`}
                        >
                          {status === "completed" && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lesson.titleVi}</p>
                          <p className="text-xs text-slate-400">{lesson.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
