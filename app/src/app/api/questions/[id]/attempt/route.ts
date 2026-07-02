import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
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
  const { selectedAnswer, confidence, context, mockExamId } = body;

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  // Record attempt
  const attempt = await prisma.attempt.create({
    data: {
      userId: session.user.id,
      questionId: id,
      selectedAnswer,
      isCorrect,
      confidence: confidence ?? "unsure",
      context: context ?? "practice",
      mockExamId: mockExamId ?? null,
    },
  });

  // Update spaced repetition schedule
  const existing = await prisma.reviewSchedule.findUnique({
    where: { userId_questionId: { userId: session.user.id, questionId: id } },
  });

  const quality = mapConfidenceToQuality(isCorrect, confidence ?? "unsure");
  const { nextInterval, nextEaseFactor, nextRepetitions } = calculateNextReview(
    existing?.repetitions ?? 0,
    existing?.easeFactor ?? 2.5,
    existing?.interval ?? 1,
    quality
  );

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

  await prisma.reviewSchedule.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId: id } },
    update: {
      nextReviewAt,
      interval: nextInterval,
      easeFactor: nextEaseFactor,
      repetitions: nextRepetitions,
    },
    create: {
      userId: session.user.id,
      questionId: id,
      nextReviewAt,
      interval: nextInterval,
      easeFactor: nextEaseFactor,
      repetitions: nextRepetitions,
    },
  });

  return NextResponse.json({
    attempt,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanationCorrect: question.explanationCorrect,
    explanationA: question.explanationA,
    explanationB: question.explanationB,
    explanationC: question.explanationC,
    explanationD: question.explanationD,
  });
}
