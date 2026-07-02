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

  const lab = await prisma.lab.findUnique({
    where: { id },
    include: { subdomain: { include: { domain: true } } },
  });

  if (!lab) {
    return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  }

  const progress = await prisma.labProgress.findUnique({
    where: { userId_labId: { userId: session.user.id, labId: id } },
  });

  return NextResponse.json({ lab, progress });
}
