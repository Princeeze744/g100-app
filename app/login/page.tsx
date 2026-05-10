"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(urlError ? "Login link expired or invalid. Try again." : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendMagicLink({ email, fullName });
      if (result.error) setError(result.error);
      else setSent(true);
    });
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center animate-fade-up">
          <div className="text-6xl mb-6 animate-float">✉️</div>
          <h1 className="font-display text-4xl font-light mb-3">
            Check your <em className="text-gold">email.</em>
          </h1>
          <p className="text-sand mb-2">
            A magic link is on its way to
          </p>
          <p className="text-gold font-mono text-sm mb-8">{email}</p>
          <p className="text-ash text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Click the link from this same browser to enter G100. The link expires in 1 hour.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); setFullName(""); }}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash hover:text-cream transition cursor-pointer"
          >
            Try a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">

        <div className="flex flex-col items-center mb-12 animate-fade-up">
          <Logo size="lg" glow />
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mt-4">
            The Hundred · Members only
          </div>
        </div>

        <div className="text-center mb-8 animate-fade-up delay-100">
          <h1 className="font-display text-4xl font-light tracking-tight mb-2">
            Enter <em className="text-gold">G100.</em>
          </h1>
          <p className="text-sand text-sm">
            One link. No passwords. Pure cruise.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-up delay-200">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash block mb-2">
              Full name <span className="text-bronze normal-case tracking-normal">(new members only)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tobi Adeyemi"
              className="w-full bg-coal border border-line rounded-xl px-4 py-3.5 text-cream placeholder:text-ash focus:border-gold/40 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-coal border border-line rounded-xl px-4 py-3.5 text-cream placeholder:text-ash focus:border-gold/40 focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="text-sm text-ember bg-ember/10 border border-ember/30 rounded-xl px-4 py-3 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !email}
            className="w-full bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-xl hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {pending ? "Sending..." : "Send magic link →"}
          </button>
        </form>

        <div className="mt-12 text-center animate-fade-up delay-300">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash">
            Membership by referral · 100 seats only
          </p>
        </div>
      </div>
    </main>
  );
}
