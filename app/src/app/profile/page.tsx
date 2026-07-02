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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hồ sơ & Cài đặt</h1>

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
                Thành viên từ {new Date(user.createdAt).toLocaleDateString("vi-VN")}
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
              <p className="text-xs text-slate-500 mt-1">Câu đã làm</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-green-600">{completedLessons}</p>
              <p className="text-xs text-slate-500 mt-1">Bài học xong</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="py-4">
              <p className="text-2xl font-bold text-purple-600">{completedLabs}</p>
              <p className="text-xs text-slate-500 mt-1">Lab xong</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings form */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Cài đặt học tập</h2>
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
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Bắt đầu nhanh</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/diagnostic" className="block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Làm bài kiểm tra đầu vào →
            </a>
            <p className="text-xs text-slate-400">
              Tìm ra bạn nên tập trung ôn tập ở đâu
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
