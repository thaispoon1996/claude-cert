import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mode, domainFilter } = body;

  // Get questions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (domainFilter) {
    where.subdomain = { domainId: domainFilter };
  }

  const limit = mode === "mini" ? 20 : 60;
  const questions = await prisma.question.findMany({
    where,
    take: limit * 2,
    select: { id: true, subdomainId: true },
  });

  // Shuffle and pick
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, limit);
  const questionIds = JSON.stringify(shuffled.map((q) => q.id));

  const session2 = await prisma.mockExamSession.create({
    data: {
      userId: session.user.id,
      mode,
      domainFilter: domainFilter ?? null,
      questionIds,
    },
  });

  return NextResponse.json(session2);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.mockExamSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(sessions);
}
