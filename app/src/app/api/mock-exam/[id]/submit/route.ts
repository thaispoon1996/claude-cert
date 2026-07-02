import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateScaledScore } from "@/lib/utils";
import { calculateNextReview, mapConfidenceToQuality } from "@/lib/spaced-repetition";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { answers, timeSpentSec } = body;
  // answers: Record<questionId, { selectedAnswer: string, confidence: string }>

  const examSession = await prisma.mockExamSession.findUnique({ where: { id } });
  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questionIds: string[] = JSON.parse(examSession.questionIds);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { subdomain: { include: { domain: true } } },
  });

  // Score the exam
  let correct = 0;
  const domainCorrect: Record<string, { correct: number; total: number; domainNumber: number }> = {};

  const attemptData = [];

  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer) continue;

    const isCorrect = answer.selectedAnswer === question.correctAnswer;
    if (isCorrect) correct++;

    const domainId = question.subdomain.domainId;
    const domainNum = (question.subdomain.domain as { number: number }).number;
    if (!domainCorrect[domainId]) {
      domainCorrect[domainId] = { correct: 0, total: 0, domainNumber: domainNum };
    }
    domainCorrect[domainId].total++;
    if (isCorrect) domainCorrect[domainId].correct++;

    attemptData.push({
      userId: session.user.id,
      questionId: question.id,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
      confidence: answer.confidence ?? "unsure",
      context: "mock_exam",
      mockExamId: id,
    });
  }

  // Create all attempts
  await prisma.attempt.createMany({ data: attemptData });

  // Update spaced repetition for each
  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer) continue;
    const isCorrect = answer.selectedAnswer === question.correctAnswer;
    const quality = mapConfidenceToQuality(isCorrect, answer.confidence ?? "unsure");

    const existing = await prisma.reviewSchedule.findUnique({
      where: { userId_questionId: { userId: session.user.id, questionId: question.id } },
    });

    const { nextInterval, nextEaseFactor, nextRepetitions } = calculateNextReview(
      existing?.repetitions ?? 0,
      existing?.easeFactor ?? 2.5,
      existing?.interval ?? 1,
      quality
    );

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

    await prisma.reviewSchedule.upsert({
      where: { userId_questionId: { userId: session.user.id, questionId: question.id } },
      update: { nextReviewAt, interval: nextInterval, easeFactor: nextEaseFactor, repetitions: nextRepetitions },
      create: {
        userId: session.user.id,
        questionId: question.id,
        nextReviewAt,
        interval: nextInterval,
        easeFactor: nextEaseFactor,
        repetitions: nextRepetitions,
      },
    });
  }

  const total = questionIds.length;
  const scaledScore = calculateScaledScore(correct, total);
  const passed = scaledScore >= 700;

  // Domain scores
  const domainScores = Object.entries(domainCorrect).reduce(
    (acc, [domainId, data]) => {
      acc[domainId] = {
        correct: data.correct,
        total: data.total,
        percent: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        domainNumber: data.domainNumber,
      };
      return acc;
    },
    {} as Record<string, { correct: number; total: number; percent: number; domainNumber: number }>
  );

  const updated = await prisma.mockExamSession.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      timeSpentSec,
      rawScore: correct,
      scaledScore,
      passed,
      domainScores: JSON.stringify(domainScores),
    },
  });

  return NextResponse.json({
    session: updated,
    correct,
    total,
    scaledScore,
    passed,
    domainScores,
  });
}
