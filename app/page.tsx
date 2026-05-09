import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
      <div className="max-w-2xl w-full text-center space-y-10">

        <div className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.25em] text-gold">
          <span className="h-px w-8 bg-gold"></span>
          <span>System online</span>
          <span className="h-px w-8 bg-gold"></span>
        </div>

        <div className="space-y-6">
          <h1 className="font-display font-light text-6xl md:text-8xl leading-[0.95] tracking-tight">
            The <em className="text-gold">Hundred.</em>
          </h1>
          <p className="text-sand text-lg md:text-xl leading-relaxed max-w-md mx-auto">
            A private digital home for the squad. Built for the flex, designed for the cruise.
          </p>
        </div>

        <Link
          href="/hq"
          className="inline-flex items-center gap-3 bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] px-7 py-4 rounded-full hover:brightness-110 transition active:scale-95"
        >
          Enter HQ
          <span className="text-base">→</span>
        </Link>

        <div className="pt-12 font-mono text-[10px] uppercase tracking-[0.15em] text-ash">
          Step 03 · Hangout HQ live · Port Harcourt, NG
        </div>

      </div>
    </main>
  );
}
