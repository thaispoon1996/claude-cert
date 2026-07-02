import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDomainColorClass } from "@/lib/utils";
import Link from "next/link";
import { FlaskConical, CheckCircle, Clock } from "lucide-react";

export default async function LabsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const labs = await prisma.lab.findMany({
    orderBy: [{ subdomain: { domain: { number: "asc" } } }, { order: "asc" }],
    include: {
      subdomain: { include: { domain: true } },
      progress: { where: { userId: session.user.id } },
    },
  });

  // Group by domain
  const byDomain = labs.reduce(
    (acc, lab) => {
      const domainId = lab.subdomain.domainId;
      if (!acc[domainId]) acc[domainId] = { domain: lab.subdomain.domain, labs: [] };
      acc[domainId].labs.push(lab);
      return acc;
    },
    {} as Record<string, { domain: { number: number; nameVi: string; name: string }; labs: typeof labs }>
  );

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Labs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Hands-on exercises to reinforce your learning
          </p>
        </div>

        {Object.values(byDomain).map(({ domain, labs: domainLabs }) => (
          <div key={domain.number}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getDomainColorClass(domain.number)}`}>
                {domain.number}
              </span>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">{domain.nameVi}</h2>
            </div>

            <div className="space-y-2">
              {domainLabs.map((lab) => {
                const progress = lab.progress[0];
                const isCompleted = progress?.status === "completed";
                const isInProgress = progress?.status === "in_progress";

                return (
                  <Link key={lab.id} href={`/labs/${lab.id}`}>
                    <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${isCompleted ? "bg-green-100 dark:bg-green-900" : "bg-slate-100 dark:bg-slate-800"}`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <FlaskConical className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lab.titleVi}</p>
                          <p className="text-xs text-slate-400">{lab.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCompleted && <Badge variant="success">Done</Badge>}
                          {isInProgress && (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              In Progress
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {labs.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No labs available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
