import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PracticeSession } from "@/components/practice/practice-session";

export default async function PracticeSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; domainId?: string; limit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { mode = "random", domainId, limit = "10" } = await searchParams;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PracticeSession
          mode={mode}
          domainId={domainId}
          limit={parseInt(limit, 10)}
        />
      </div>
    </AppShell>
  );
}
