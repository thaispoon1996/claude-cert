import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { LabViewer } from "@/components/labs/lab-viewer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function LabPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { labId } = await params;

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    include: { subdomain: { include: { domain: true } } },
  });

  if (!lab) notFound();

  const progress = await prisma.labProgress.findUnique({
    where: { userId_labId: { userId: session.user.id, labId } },
  });

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/labs" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs text-slate-400">{lab.subdomain.domain.nameVi} · {lab.subdomain.nameVi}</p>
            <h1 className="font-bold text-slate-900 dark:text-slate-100">{lab.titleVi}</h1>
          </div>
        </div>

        <LabViewer lab={lab} progress={progress} />
      </div>
    </AppShell>
  );
}
