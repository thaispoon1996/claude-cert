import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { DiagnosticSession } from "@/components/diagnostic/diagnostic-session";

export default async function DiagnosticPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const questions = await prisma.question.findMany({
    where: { isDiagnostic: true },
    take: 20,
    include: { subdomain: { include: { domain: true } } },
  });

  // Shuffle
  const shuffled = questions.sort(() => Math.random() - 0.5);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <DiagnosticSession questions={shuffled} />
      </div>
    </AppShell>
  );
}
