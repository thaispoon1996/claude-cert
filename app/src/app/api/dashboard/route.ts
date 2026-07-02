import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all domains with their subdomains
  const domains = await prisma.domain.findMany({
    orderBy: { number: "asc" },
    include: {
      subdomains: {
        include: {
          questions: { select: { id: true } },
        },
      },
    },
  });

  // Get user attempts grouped by question
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    include: {
      question: {
        include: { subdomain: { include: { domain: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate domain progress
  const domainProgress = domains.map((domain) => {
    const domainQuestionIds = domain.subdomains.flatMap((s) => s.questions.map((q) => q.id));
    const domainAttempts = attempts.filter((a) => domainQuestionIds.includes(a.questionId));

    // Latest attempt per question
    const latestByQuestion = new Map<string, { isCorrect: boolean }>();
    for (const attempt of domainAttempts) {
      if (!latestByQuestion.has(attempt.questionId)) {
        latestByQuestion.set(attempt.questionId, { isCorrect: attempt.isCorrect });
      }
    }

    const answered = latestByQuestion.size;
    const correct = Array.from(latestByQuestion.values()).filter((a) => a.isCorrect).length;
    const total = domainQuestionIds.length;
    const masteryPercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      domain: { id: domain.id, number: domain.number, name: domain.name, nameVi: domain.nameVi, weight: domain.weight },
      totalQuestions: total,
      answeredCorrect: correct,
      answeredTotal: answered,
      masteryPercent,
    };
  });

  // Weak spots: subdomains with lowest accuracy (min 3 attempts)
  const subdomainStats = new Map<
    string,
    { subdomain: typeof domains[0]["subdomains"][0]; domain: typeof domains[0]; correct: number; total: number }
  >();

  for (const attempt of attempts) {
    const subdomainId = attempt.question.subdomainId;
    const domain = domains.find((d) => d.subdomains.some((s) => s.id === subdomainId));
    const subdomain = domain?.subdomains.find((s) => s.id === subdomainId);
    if (!domain || !subdomain) continue;

    if (!subdomainStats.has(subdomainId)) {
      subdomainStats.set(subdomainId, { subdomain, domain, correct: 0, total: 0 });
    }
    const stat = subdomainStats.get(subdomainId)!;
    stat.total++;
    if (attempt.isCorrect) stat.correct++;
  }

  const weakSpots = Array.from(subdomainStats.values())
    .filter((s) => s.total >= 3)
    .map((s) => ({
      subdomain: { id: s.subdomain.id, number: s.subdomain.number, name: s.subdomain.name, nameVi: s.subdomain.nameVi },
      domain: { id: s.domain.id, number: s.domain.number, name: s.domain.name, nameVi: s.domain.nameVi },
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      totalAttempts: s.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  // Calculate streak (consecutive days with practice)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);

  while (true) {
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    const hasAttempt = attempts.some((a) => {
      const d = new Date(a.createdAt);
      return d >= dayStart && d <= dayEnd;
    });

    if (!hasAttempt) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const recentAttempts = attempts.filter((a) => {
    const d = new Date(a.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return NextResponse.json({
    totalAnswered,
    totalCorrect,
    streak,
    domainProgress,
    weakSpots,
    recentAttempts,
  });
}
