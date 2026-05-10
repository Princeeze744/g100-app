"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { sendMagicLink } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      try {
        const result = await sendMagicLink({ email, fullName });
        if (result && typeof result === "object" && "error" in result && result.error) {
          setError(String(result.error));
        } else {
          setSuccess(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-6 animate-fade-up">📬</div>
        <h2 className="font-display text-2xl lg:text-3xl text-cream mb-3 font-light">Check your email.</h2>
        <p className="text-sand text-sm">
          We sent a magic link to <span className="text-gold">{email}</span>
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-ash mt-6">Click it from any device to sign in</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(errorParam || error) && (
        <div className="bg-ember/10 border border-ember/30 text-ember text-xs rounded-lg px-3 py-2.5 font-mono">
          {error || (errorParam === "auth_failed" ? "Magic link expired. Try again." : String(errorParam))}
        </div>
      )}
      <div>
        <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash block mb-1.5">Your name</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full bg-night border border-line rounded-lg px-3 py-3 text-cream text-sm placeholder:text-ash focus:border-gold/40 focus:outline-none transition"
        />
      </div>
      <div>
        <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash block mb-1.5">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-night border border-line rounded-lg px-3 py-3 text-cream text-sm placeholder:text-ash focus:border-gold/40 focus:outline-none transition"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] py-3.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "Sending..." : "Send magic link →"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" glow />
          </div>
          <Wordmark className="text-3xl mb-2 inline-block" />
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mt-1">The Hundred · Port Harcourt</div>
        </div>

        <div className="bg-coal border border-line rounded-2xl p-6 lg:p-8">
          <Suspense fallback={<div className="font-mono text-xs text-ash text-center py-8">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-ash mt-6 font-mono">
          Members only · <Link href="/" className="text-gold hover:underline">← Back</Link>
        </p>
      </div>
    </main>
  );
}
