import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { examDate, dailyGoalMinutes, notifyEnabled, notifyHour } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      examDate: examDate ? new Date(examDate) : null,
      dailyGoalMinutes,
      notifyEnabled,
      notifyHour,
    },
  });

  return NextResponse.json(user);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      examDate: true,
      dailyGoalMinutes: true,
      notifyEnabled: true,
      notifyHour: true,
    },
  });

  return NextResponse.json(user);
}
