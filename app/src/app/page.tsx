import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <span className="text-white font-black text-2xl">CP</span>
        </div>
        <h1 className="text-3xl font-bold text-white">ClaudePath</h1>
        <p className="text-indigo-300 mt-1 text-sm">Claude Certified Architect Foundations</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Sign in to study</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Enter your email to start or continue studying for the CCA-F exam.
        </p>
        <LoginForm />
      </div>

      {/* Features */}
      <div className="mt-10 grid grid-cols-3 gap-4 text-center max-w-sm w-full">
        {[
          { emoji: "🧠", label: "Spaced Repetition" },
          { emoji: "📊", label: "5 Domains" },
          { emoji: "🎯", label: "Mock Exams" },
        ].map(({ emoji, label }) => (
          <div key={label} className="text-center">
            <div className="text-2xl mb-1">{emoji}</div>
            <p className="text-xs text-indigo-300">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
