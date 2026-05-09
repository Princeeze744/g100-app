"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";

// === MOCK DATA ===
const member = {
  number: "047",
  firstName: "Tobi",
  fullName: "Tobi Adeyemi",
  role: "Software Architect",
  hangouts: 12,
  vibeScore: 9.4,
  vouches: 3,
  awards: 2,
};

const nextEventDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 9);
  d.setHours(16, 0, 0, 0);
  return d;
})();

const nextEvent = {
  title: "All-White Picnic",
  location: "Bonny Camp Beach",
  totalSpots: 100,
  initialConfirmed: 47,
};

const recentMoments = [
  "from-[#4a3520] to-[#1a1308]",
  "from-[#2a3a4a] to-[#08141a]",
  "from-[#4a2030] to-[#1a0810]",
  "from-[#3a4a20] to-[#0a1a08]",
  "from-[#4a3a20] to-[#1a1408]",
  "from-[#2a2a4a] to-[#08081a]",
];

const initialActivity = [
  { id: 1, who: "Adesuwa", num: "#012", what: "locked in for the picnic", time: "2m" },
  { id: 2, who: "Chika", num: "#089", what: "uploaded 4 photos to the vault", time: "8m" },
  { id: 3, who: "Emeka", num: "#031", what: "voted for Cruise King", time: "12m" },
  { id: 4, who: "Folake", num: "#055", what: "joined the squad", time: "1h" },
];

const possibleActivities = [
  { who: "Maryam", num: "#073", what: "vouched for a new member" },
  { who: "Kelechi", num: "#024", what: "uploaded photos from movie night" },
  { who: "Ngozi", num: "#091", what: "locked in for the picnic" },
  { who: "Tunde", num: "#018", what: "shared a milestone" },
  { who: "Bisi", num: "#066", what: "voted in the awards" },
  { who: "Ifeoma", num: "#042", what: "RSVP'd for next month's hangout" },
];

const navItems = [
  { label: "Home", href: "/hq", active: true },
  { label: "Events", href: "/events" },
  { label: "Squad", href: "/squad" },
  { label: "Vault", href: "/vault" },
  { label: "Me", href: "/me" },
];

// === COUNTDOWN HOOK ===
function useCountdown(target: Date) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const dist = target.getTime() - Date.now();
      if (dist < 0) return setT({ d: 0, h: 0, m: 0, s: 0 });
      setT({
        d: Math.floor(dist / 86400000),
        h: Math.floor((dist / 3600000) % 24),
        m: Math.floor((dist / 60000) % 60),
        s: Math.floor((dist / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

// === MAIN PAGE ===
export default function HangoutHQ() {
  const [lockedIn, setLockedIn] = useState(false);
  const [confirmed, setConfirmed] = useState(nextEvent.initialConfirmed);
  const [activity, setActivity] = useState(initialActivity);
  const cd = useCountdown(nextEventDate);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = possibleActivities[Math.floor(Math.random() * possibleActivities.length)];
      setActivity(prev => [
        { id: Date.now(), ...random, time: "now" },
        ...prev.slice(0, 3),
      ]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePullUp = () => {
    setLockedIn(!lockedIn);
    setConfirmed(c => lockedIn ? c - 1 : c + 1);
  };

  const formattedDate = nextEventDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen lg:flex">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-line p-8 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 animate-fade-up">
          <Logo size="sm" glow />
          <div>
            <Wordmark className="text-2xl" />
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash mt-0.5">
              The Hundred
            </div>
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-12 mt-3">
          Port Harcourt · NG
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer ${
                item.active
                  ? "bg-stone text-gold"
                  : "text-sand hover:bg-coal hover:text-cream"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-gold" : "bg-ash"}`}></span>
              <span className="font-sans text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/me" className="mt-auto pt-8 border-t border-line group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash">Member</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold opacity-0 group-hover:opacity-100 transition">View card -&gt;</div>
          </div>
          <div className="flex items-center gap-3 group-hover:translate-x-1 transition">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-bronze to-coal border border-gold/40 group-hover:border-gold flex items-center justify-center font-display text-lg text-gold shrink-0 transition">
              {member.firstName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm text-cream font-medium truncate group-hover:text-gold transition">{member.fullName}</div>
              <div className="font-mono text-[10px] text-gold tracking-wider">#{member.number}</div>
            </div>
          </div>
        </Link>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-md lg:max-w-none mx-auto px-5 lg:px-12 pt-6 lg:pt-12 pb-28 lg:pb-12 flex flex-col gap-4 lg:gap-6">

        <header className="flex lg:hidden items-start justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash mb-1">
              Welcome back
            </div>
            <h1 className="font-display text-3xl font-normal tracking-tight">
              {member.firstName}
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-coal border border-line rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
            <span className="font-mono text-[11px] font-bold text-gold tracking-wider">
              #{member.number}
            </span>
          </div>
        </header>

        <header className="hidden lg:flex items-end justify-between mb-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-3">
              Welcome back
            </div>
            <h1 className="font-display text-5xl font-light tracking-tight">
              {member.firstName} <em className="text-gold">Adeyemi.</em>
            </h1>
          </div>
          <div className="font-mono text-xs text-ash uppercase tracking-[0.2em]">
            {today}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

          <div className="lg:col-span-2 bg-coal border border-line rounded-2xl p-5 lg:p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"></div>
            <div className="absolute inset-0 holographic pointer-events-none opacity-50"></div>
            <div className="relative z-10">

            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-gold animate-ping opacity-75"></span>
                <span className="relative rounded-full w-2 h-2 bg-gold"></span>
              </span>
              <span className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.25em] text-gold">
                Next up
              </span>
            </div>

            <h2 className="font-display text-3xl lg:text-5xl leading-tight font-normal mb-3">
              {nextEvent.title}
            </h2>

            <div className="text-xs lg:text-sm text-sand mb-5 leading-relaxed">
              <div>{formattedDate} - 4pm</div>
              <div>{nextEvent.location}</div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5 py-4 border-y border-line">
              <CountdownCell value={cd.d} label="Days" />
              <CountdownCell value={cd.h} label="Hrs" />
              <CountdownCell value={cd.m} label="Min" />
              <CountdownCell value={cd.s} label="Sec" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-[9px] lg:text-[10px] uppercase tracking-widest text-ash">
                <span className="text-cream font-bold">{confirmed}</span> / {nextEvent.totalSpots} confirmed
              </div>
              <button
                onClick={handlePullUp}
                className={`font-mono text-[10px] lg:text-xs font-bold uppercase tracking-widest px-4 lg:px-6 py-2 lg:py-3 rounded-full transition-all active:scale-95 cursor-pointer ${
                  lockedIn
                    ? "bg-bronze text-cream"
                    : "bg-gold text-night hover:brightness-110"
                }`}
              >
                {lockedIn ? "Locked in" : "Pull up"}
              </button>
            </div>
            </div>
          </div>

          <div className="bg-coal border border-line rounded-2xl p-5 lg:p-6 relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-ember animate-ping opacity-75"></span>
                <span className="relative rounded-full w-2 h-2 bg-ember"></span>
              </span>
              <span className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.25em] text-ember">
                Live activity
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {activity.map(a => (
                <div key={a.id} className="flex gap-3 group animate-[fadeIn_0.5s_ease-out]">
                  <div className="w-8 h-8 rounded-full bg-stone border border-line flex items-center justify-center font-mono text-[10px] text-gold shrink-0">
                    {a.who[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs lg:text-sm text-cream leading-snug">
                      <span className="font-medium text-gold">{a.who}</span>
                      <span className="text-sand"> {a.what}</span>
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-ash mt-1">
                      {a.num} - {a.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <StatCard label="Hangouts" value={member.hangouts.toString()} />
          <StatCard label="Vibe score" value={member.vibeScore.toString()} accent />
          <StatCard label="Vouches" value={member.vouches.toString()} />
          <StatCard label="Awards" value={member.awards.toString()} accent />
        </div>

        <div className="mt-2">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.25em] text-ash">
              From the vault - Movie night
            </div>
            <button className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.2em] text-gold hover:brightness-110 cursor-pointer">
              View all
            </button>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 lg:gap-3">
            {recentMoments.map((g, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg lg:rounded-xl border border-line bg-gradient-to-br ${g} relative overflow-hidden cursor-pointer hover:border-gold/40 hover:scale-[1.02] transition`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-cream/5"></div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <nav
        className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-coal/95 backdrop-blur-xl border-t border-line px-4 pt-3 flex justify-around"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {navItems.map(item => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 cursor-pointer transition ${
              item.active ? "text-gold" : "text-ash hover:text-sand"
            }`}
          >
            <div
              className={`rounded-full ${
                item.active ? "w-1.5 h-1.5 bg-gold shadow-[0_0_8px_currentColor]" : "w-1 h-1 bg-current"
              }`}
            ></div>
            <span className="font-mono text-[8px] uppercase tracking-widest">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-display text-2xl lg:text-4xl font-normal text-gold tabular-nums leading-none">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="font-mono text-[8px] lg:text-[9px] uppercase tracking-widest text-ash mt-1.5 lg:mt-2">
        {label}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-coal border border-line rounded-xl px-3 py-3 lg:px-5 lg:py-4">
      <div className="font-mono text-[8px] lg:text-[10px] uppercase tracking-[0.2em] text-ash mb-1.5">
        {label}
      </div>
      <div className={`font-display text-2xl lg:text-3xl font-normal leading-none ${accent ? "text-gold" : "text-cream"}`}>
        {value}
      </div>
    </div>
  );
}
