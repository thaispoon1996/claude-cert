"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProfileFormProps {
  userId: string;
  examDate: string;
  dailyGoalMinutes: number;
  notifyEnabled: boolean;
  notifyHour: number;
}

export function ProfileForm({
  userId,
  examDate: initialExamDate,
  dailyGoalMinutes: initialGoal,
  notifyEnabled: initialNotify,
  notifyHour: initialHour,
}: ProfileFormProps) {
  const router = useRouter();
  const [examDate, setExamDate] = useState(initialExamDate);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(initialGoal);
  const [notifyEnabled, setNotifyEnabled] = useState(initialNotify);
  const [notifyHour, setNotifyHour] = useState(initialHour);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examDate: examDate || null, dailyGoalMinutes, notifyEnabled, notifyHour }),
    });

    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Ngày dự kiến thi
        </label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-slate-400 mt-1">Bật đếm ngược ngày thi trên trang Tổng quan</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Mục tiêu học mỗi ngày
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={dailyGoalMinutes}
            onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="w-24 text-sm font-medium text-slate-700 dark:text-slate-300">
            {dailyGoalMinutes} phút/ngày
          </span>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyEnabled}
            onChange={(e) => setNotifyEnabled(e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nhắc học hằng ngày
          </span>
        </label>
        {notifyEnabled && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-slate-500">Nhắc tôi vào lúc</label>
            <select
              value={notifyHour}
              onChange={(e) => setNotifyHour(Number(e.target.value))}
              className="px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saved ? "Đã lưu!" : saving ? "Đang lưu..." : "Lưu cài đặt"}
      </Button>
    </form>
  );
}
