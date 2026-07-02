import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartExamButton } from "@/components/exam/start-exam-button";
import { formatScore } from "@/lib/utils";
import { ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default async function ExamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const pastSessions = await prisma.mockExamSession.findMany({
    where: { userId: session.user.id, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const domains = await prisma.domain.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, name: true, nameVi: true },
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mock Exam</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Simulate the real CCA-F exam environment
          </p>
        </div>

        {/* Exam options */}
        <div className="grid gap-4">
          <Card className="border-2 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-xl">
                  <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Full Mock Exam</h2>
                  <p className="text-sm text-slate-500 mt-1">60 questions · 120 minutes · All domains</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 2 hours
                    </span>
                    <span className="text-xs text-slate-400">Passing score: 700/1000</span>
                  </div>
                </div>
                <StartExamButton mode="full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Mini Mock by Domain</h2>
              <p className="text-sm text-slate-500">20 questions · 40 minutes · Focus on one domain</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      {domain.number}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{domain.nameVi}</span>
                  </div>
                  <StartExamButton mode="mini" domainId={domain.id} size="sm" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Exam history */}
        {pastSessions.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Past Exams</h2>
            <div className="space-y-3">
              {pastSessions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {s.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {s.mode === "mini" ? "Mini Mock" : "Full Mock"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(s.startedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {s.scaledScore !== null ? formatScore(s.scaledScore) : "--"}
                      </p>
                      <Badge variant={s.passed ? "success" : "danger"} className="text-xs">
                        {s.passed ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    <a href={`/exam/${s.id}/results`} className="text-xs text-indigo-500 hover:underline ml-2">
                      View
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
