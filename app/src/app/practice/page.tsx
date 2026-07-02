import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Brain, Target, Shuffle, Zap } from "lucide-react";

export default async function PracticePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const domains = await prisma.domain.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, name: true, nameVi: true },
  });

  const modes = [
    {
      href: "/practice/session?mode=domain",
      icon: Brain,
      title: "By Domain",
      description: "Practice questions from a specific domain",
      color: "bg-blue-500",
    },
    {
      href: "/practice/session?mode=weak-spots",
      icon: Target,
      title: "Weak Spots",
      description: "Focus on questions you've gotten wrong",
      color: "bg-red-500",
    },
    {
      href: "/practice/session?mode=random&limit=20",
      icon: Shuffle,
      title: "Weighted Random",
      description: "Random mix weighted by domain exam weight",
      color: "bg-purple-500",
    },
    {
      href: "/practice/session?mode=quick&limit=5",
      icon: Zap,
      title: "Quick 5",
      description: "5-question rapid-fire practice",
      color: "bg-orange-500",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Practice</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Choose your study mode</p>
        </div>

        {/* Modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link key={mode.href} href={mode.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 flex gap-4 items-start">
                    <div className={`${mode.color} p-2.5 rounded-lg flex-shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{mode.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{mode.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Domain selector */}
        <div>
          <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wide">
            Practice by Domain
          </h2>
          <div className="space-y-2">
            {domains.map((domain) => (
              <Link
                key={domain.id}
                href={`/practice/session?mode=domain&domainId=${domain.id}`}
              >
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {domain.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{domain.nameVi}</p>
                      <p className="text-xs text-slate-400">{domain.name}</p>
                    </div>
                    <Brain className="h-4 w-4 text-slate-300" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
