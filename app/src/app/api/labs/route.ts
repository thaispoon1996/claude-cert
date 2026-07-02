import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const labs = await prisma.lab.findMany({
    orderBy: { order: "asc" },
    include: {
      subdomain: { include: { domain: true } },
      progress: { where: { userId: session.user.id } },
    },
  });

  return NextResponse.json(labs);
}
