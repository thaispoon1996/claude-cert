import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const examSession = await prisma.mockExamSession.findUnique({
    where: { id },
    include: { attempts: { include: { question: true } } },
  });

  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Parse question IDs and fetch questions
  const questionIds: string[] = JSON.parse(examSession.questionIds);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { subdomain: { include: { domain: true } } },
  });

  // Sort by original order
  const sortedQuestions = questionIds
    .map((qid) => questions.find((q) => q.id === qid))
    .filter(Boolean);

  return NextResponse.json({ session: examSession, questions: sortedQuestions });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { timeSpentSec } = body;

  const examSession = await prisma.mockExamSession.findUnique({ where: { id } });
  if (!examSession || examSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.mockExamSession.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      timeSpentSec,
    },
  });

  return NextResponse.json(updated);
}
