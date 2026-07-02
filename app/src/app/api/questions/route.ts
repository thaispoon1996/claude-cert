import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domainId");
  const subdomainId = searchParams.get("subdomainId");
  const mode = searchParams.get("mode");
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  const isDiagnostic = searchParams.get("isDiagnostic") === "true";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (isDiagnostic) {
    where.isDiagnostic = true;
  }

  if (subdomainId) {
    where.subdomainId = subdomainId;
  } else if (domainId) {
    where.subdomain = { domainId };
  }

  if (mode === "weak-spots") {
    // Get questions the user has gotten wrong recently
    const wrongAttempts = await prisma.attempt.findMany({
      where: { userId: session.user.id, isCorrect: false },
      select: { questionId: true },
      distinct: ["questionId"],
      take: 50,
    });
    const wrongIds = wrongAttempts.map((a) => a.questionId);
    where.id = { in: wrongIds };
  }

  let questions = await prisma.question.findMany({
    where,
    take: limit * 3,
    include: {
      subdomain: { include: { domain: true } },
    },
  });

  // Shuffle for random/weighted modes
  if (mode === "random" || mode === "quick") {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  questions = questions.slice(0, limit);

  return NextResponse.json(questions);
}
