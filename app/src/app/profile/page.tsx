import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

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
      createdAt: true,
    },
  });

  if (!user) redirect("/");

  const attemptCount = await prisma.attempt.count({ where: { userId: session.user.id } });
  const completedLessons = await prisma.lessonProgress.count({
    where: { userId: session.user.id, status: "completed" },
  });
  const completedLabs = await prisma.labProgress.count({
    where: { userId: session.user.id, status: "completed" },
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile & Settings</h1>

        {/* User info */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <User className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <SignOutButton />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-indigo-600">{attemptCount}</p>
              <p className="text-xs text-slate-500 mt-1">Questions Answered</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-green-600">{completedLessons}</p>
              <p className="text-xs text-slate-500 mt-1">Lessons Done</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-purple-600">{completedLabs}</p>
              <p className="text-xs text-slate-500 mt-1">Labs Done</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings form */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Study Settings</h2>
          </CardHeader>
          <CardContent>
            <ProfileForm
              userId={user.id}
              examDate={user.examDate ? user.examDate.toISOString().split("T")[0] : ""}
              dailyGoalMinutes={user.dailyGoalMinutes}
              notifyEnabled={user.notifyEnabled}
              notifyHour={user.notifyHour}
            />
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Quick Start</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/diagnostic" className="block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Take Diagnostic Assessment →
            </a>
            <p className="text-xs text-slate-400">
              Find out where to focus your study efforts
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
