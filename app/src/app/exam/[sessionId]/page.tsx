import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ExamSession } from "@/components/exam/exam-session";

export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { sessionId } = await params;

  const examSession = await prisma.mockExamSession.findUnique({
    where: { id: sessionId },
  });

  if (!examSession || examSession.userId !== session.user.id) notFound();

  // If already finished, redirect to results
  if (examSession.finishedAt) {
    redirect(`/exam/${sessionId}/results`);
  }

  const questionIds: string[] = JSON.parse(examSession.questionIds);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { subdomain: { include: { domain: true } } },
  });

  // Sort by original order
  const sortedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean);

  const timeLimitSecs = examSession.mode === "mini" ? 40 * 60 : 120 * 60;

  return (
    <AppShell>
      <ExamSession
        sessionId={sessionId}
        questions={sortedQuestions as typeof questions}
        timeLimitSecs={timeLimitSecs}
        mode={examSession.mode}
      />
    </AppShell>
  );
}
