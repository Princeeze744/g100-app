"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

type Member = {
  id: string;
  member_number: number;
  full_name: string;
  role: string | null;
  status: string;
  joined_at: string;
};

type SortKey = "seat" | "joined" | "alpha";

const navItems = [
  { label: "Home", href: "/hq", active: false },
  { label: "Events", href: "/events", active: false },
  { label: "Squad", href: "/squad", active: true },
  { label: "Vault", href: "/vault", active: false },
  { label: "Me", href: "/me", active: false },
];

export default function SquadPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<{ member_number: number; full_name: string } | null>(null);
  const [sort, setSort] = useState<SortKey>("seat");

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: me } = await supabase
          .from("members")
          .select("member_number, full_name")
          .eq("id", user.id)
          .single();
        if (me) setMyProfile(me);
      }
      const { data } = await supabase
        .from("members")
        .select("id, member_number, full_name, role, status, joined_at")
        .order("member_number", { ascending: true });
      if (data) setMembers(data);
    };
    init();

    const channel = supabase
      .channel("squad-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => init())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sort === "seat") return a.member_number - b.member_number;
    if (sort === "joined") return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
    return a.full_name.localeCompare(b.full_name);
  });

  const memberMap = new Map(members.map(m => [m.member_number, m]));
  const allSlots: Array<Member | { empty: true; member_number: number }> =
    sort === "seat"
      ? Array.from({ length: 100 }, (_, i) => memberMap.get(i + 1) || { empty: true, member_number: i + 1 })
      : sortedMembers;

  const filledCount = members.length;
  const remainingCount = 100 - filledCount;

  const myFirstName = myProfile?.full_name.split(" ")[0] ?? "";
  const myFullName = myProfile?.full_name ?? "Loading...";
  const myNumber = myProfile ? String(myProfile.member_number).padStart(3, "0") : "...";

  return (
    <div className="min-h-screen lg:flex">

      <aside className="hidden lg:flex flex-col w-72 border-r border-line p-8 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 animate-fade-up">
          <Logo size="sm" glow />
          <div>
            <Wordmark className="text-2xl" />
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash mt-0.5">The Hundred</div>
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-12 mt-3">Port Harcourt · NG</div>

        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer " + (item.active ? "bg-stone text-gold" : "text-sand hover:bg-coal hover:text-cream")}
            >
              <span className={"w-1.5 h-1.5 rounded-full " + (item.active ? "bg-gold" : "bg-ash")}></span>
              <span className="font-sans text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/me" className="mt-auto pt-8 border-t border-line group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash">Member</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold opacity-0 group-hover:opacity-100 transition">View card →</div>
          </div>
          <div className="flex items-center gap-3 group-hover:translate-x-1 transition">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-bronze to-coal border border-gold/40 group-hover:border-gold flex items-center justify-center font-display text-lg text-gold shrink-0 transition">
              {myFirstName[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm text-cream font-medium truncate group-hover:text-gold transition">{myFullName}</div>
              <div className="font-mono text-[10px] text-gold tracking-wider">#{myNumber}</div>
            </div>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-ash hover:text-ember transition text-left cursor-pointer"
        >
          ← Sign out
        </button>
      </aside>

      <main className="flex-1 max-w-md lg:max-w-none mx-auto px-5 lg:px-12 pt-6 lg:pt-12 pb-28 lg:pb-12">

        <header className="mb-8 lg:mb-10 animate-fade-up">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-gold"></span>
            <span>The Squad</span>
          </div>
          <h1 className="font-display text-4xl lg:text-6xl font-light tracking-tight leading-[0.95]">
            One hundred. <em className="text-gold">No more.</em>
          </h1>
          <div className="flex items-baseline gap-4 mt-4">
            <p className="text-sand text-sm lg:text-base">
              <span className="text-cream font-medium">{filledCount}</span> seat{filledCount !== 1 ? "s" : ""} filled
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
              {remainingCount} remaining
            </p>
          </div>
        </header>

        <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
          {([
            { key: "seat", label: "By seat" },
            { key: "joined", label: "Newest" },
            { key: "alpha", label: "A–Z" },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={"px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest border-b-2 transition cursor-pointer whitespace-nowrap " + (sort === opt.key ? "border-gold text-gold" : "border-transparent text-ash hover:text-cream")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3">
          {allSlots.map((slot, idx) => {
            if ("empty" in slot) {
              return <EmptySeat key={"empty-" + slot.member_number} number={slot.member_number} />;
            }
            return (
              <MemberCard
                key={slot.id}
                member={slot}
                isYou={slot.id === currentUserId}
                animationDelay={idx}
              />
            );
          })}
        </div>

      </main>

      <nav
        className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-coal/95 backdrop-blur-xl border-t border-line px-4 pt-3 flex justify-around z-50"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {navItems.map(item => (
          <Link
            key={item.label}
            href={item.href}
            className={"flex flex-col items-center gap-1.5 cursor-pointer transition " + (item.active ? "text-gold" : "text-ash hover:text-sand")}
          >
            <div className={"rounded-full " + (item.active ? "w-1.5 h-1.5 bg-gold shadow-[0_0_8px_currentColor]" : "w-1 h-1 bg-current")}></div>
            <span className="font-mono text-[8px] uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function MemberCard({ member, isYou, animationDelay }: { member: Member; isYou: boolean; animationDelay: number }) {
  const initials = member.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const firstName = member.full_name.split(" ")[0];
  const num = String(member.member_number).padStart(3, "0");

  return (
    <div
      className={"relative bg-coal border rounded-xl p-3 lg:p-4 cursor-pointer transition group hover:scale-[1.03] animate-fade-up " + (isYou ? "border-gold/60 shadow-[0_0_20px_rgba(201,162,78,0.15)]" : "border-line hover:border-gold/40")}
      style={{ animationDelay: Math.min(animationDelay * 30, 600) + "ms" }}
    >
      {isYou && (
        <div className="absolute top-2 right-2 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-night bg-gold rounded-full px-1.5 py-0.5">
          You
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-2 lg:mb-3">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-bronze to-coal border border-gold/40 group-hover:border-gold flex items-center justify-center font-display text-base lg:text-lg text-gold transition">
            {initials}
          </div>
        </div>

        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-ash mb-1">#{num}</div>

        <div className="font-sans text-xs lg:text-sm font-medium text-cream truncate w-full" title={member.full_name}>
          {firstName}
        </div>

        {member.role && (
          <div className="font-display italic text-[10px] text-sand mt-0.5 truncate w-full">
            {member.role}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySeat({ number }: { number: number }) {
  const num = String(number).padStart(3, "0");
  return (
    <div className="bg-transparent border border-dashed border-line/60 rounded-xl p-3 lg:p-4 cursor-default opacity-40 hover:opacity-60 transition">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full border border-dashed border-line/80 mb-2 lg:mb-3 flex items-center justify-center">
          <span className="font-mono text-[10px] text-ash">—</span>
        </div>
        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-ash mb-1">#{num}</div>
        <div className="font-display italic text-[10px] text-ash">Open</div>
      </div>
    </div>
  );
}
