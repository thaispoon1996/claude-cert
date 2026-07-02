import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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
  const { status, quizScore } = body;

  const progress = await prisma.labProgress.upsert({
    where: { userId_labId: { userId: session.user.id, labId: id } },
    update: {
      status,
      quizScore,
      completedAt: status === "completed" ? new Date() : undefined,
    },
    create: {
      userId: session.user.id,
      labId: id,
      status,
      quizScore,
      completedAt: status === "completed" ? new Date() : undefined,
    },
  });

  return NextResponse.json(progress);
}
