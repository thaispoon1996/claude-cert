import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { LessonViewer } from "@/components/learn/lesson-viewer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SubdomainPage({
  params,
  searchParams,
}: {
  params: Promise<{ domainId: string; subdomainId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { domainId, subdomainId } = await params;
  const { lesson: lessonId } = await searchParams;

  const subdomain = await prisma.subdomain.findUnique({
    where: { id: subdomainId },
    include: {
      domain: true,
      lessons: { orderBy: { order: "asc" } },
    },
  });

  if (!subdomain || subdomain.domainId !== domainId) notFound();

  const activeLesson = lessonId
    ? await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { quizItems: true },
      })
    : subdomain.lessons[0]
    ? await prisma.lesson.findUnique({
        where: { id: subdomain.lessons[0].id },
        include: { quizItems: true },
      })
    : null;

  const progress = activeLesson
    ? await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: session.user.id, lessonId: activeLesson.id } },
      })
    : null;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link href={`/learn/${domainId}`} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs text-slate-400">{subdomain.domain.nameVi}</p>
            <h1 className="font-bold text-slate-900 dark:text-slate-100">{subdomain.nameVi}</h1>
          </div>
        </div>

        {activeLesson ? (
          <LessonViewer
            lesson={activeLesson}
            lessons={subdomain.lessons}
            progress={progress}
            userId={session.user.id}
            domainId={domainId}
            subdomainId={subdomainId}
          />
        ) : (
          <div className="text-center py-16 text-slate-400">
            <p>Subdomain này chưa có bài học nào.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
