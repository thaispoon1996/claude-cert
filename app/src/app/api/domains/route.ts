import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domains = await prisma.domain.findMany({
    orderBy: { number: "asc" },
    include: {
      subdomains: {
        orderBy: { number: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, titleVi: true, order: true },
          },
        },
      },
    },
  });

  return NextResponse.json(domains);
}
