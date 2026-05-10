"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

type MemberProfile = {
  id: string;
  member_number: number;
  full_name: string;
  role: string | null;
  status: string;
  vibe_score: number;
  joined_at: string;
};

export default function MemberCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState({ lockIns: 0, vouches: 0 });

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("members")
        .select("id, member_number, full_name, role, status, vibe_score, joined_at")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      const [lockInsRes, vouchesRes] = await Promise.all([
        supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("member_id", user.id).eq("status", "locked_in"),
        supabase.from("vouches").select("*", { count: "exact", head: true }).eq("vouched_for_id", user.id),
      ]);
      setStats({ lockIns: lockInsRes.count || 0, vouches: vouchesRes.count || 0 });
    };
    init();
  }, []);

  const handleMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };
  const handleLeave = () => setTilt({ x: 0, y: 0 });

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const memberNumber = profile ? String(profile.member_number).padStart(3, "0") : "...";
  const fullName = profile?.full_name ?? "Loading...";
  const role = profile?.role ?? "Member";
  const status = profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : "—";
  const initials = profile ? profile.full_name.split(" ").map(n => n[0]).slice(0, 2).join("") : "??";
  const joinedYear = profile ? new Date(profile.joined_at).getFullYear() : new Date().getFullYear();
  const vibeLevel = profile ? Math.round(profile.vibe_score / 2) : 0;
  const serial = profile ? "G100-" + memberNumber + "-" + String(joinedYear).slice(-2) : "—";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 lg:py-16">
      <div className="w-full max-w-md flex flex-col gap-6 animate-fade-up">

        <div className="flex items-center justify-between">
          <Link
            href="/hq"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-sand hover:text-cream transition flex items-center gap-2"
          >
            <span>←</span> Back to HQ
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">My card</div>
          <button
            onClick={handleLogout}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash hover:text-ember transition cursor-pointer"
          >
            Sign out
          </button>
        </div>

        <div
          ref={cardRef}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer transition-transform duration-200"
          style={{
            transform: "perspective(1000px) rotateX(" + tilt.x + "deg) rotateY(" + tilt.y + "deg)",
            transformStyle: "preserve-3d",
            background: "linear-gradient(145deg, #1a1612 0%, #0d0b08 100%)",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,162,78,0.2)",
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              padding: "1.5px",
              background: "linear-gradient(145deg, #C9A24E 0%, transparent 30%, transparent 70%, #8B6F2E 100%)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />

          <div className="absolute inset-0 holographic pointer-events-none" />

          <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center">
            <Logo size="xl" />
          </div>

          <div className="relative z-10 h-full flex flex-col p-7 lg:p-8">

            <div className="flex items-start justify-between mb-6">
              <Logo size="sm" />
              <div className="text-right">
                <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-ash">Class of</div>
                <div className="font-mono text-[11px] tracking-[0.1em] text-gold font-bold mt-0.5">{joinedYear}</div>
              </div>
            </div>

            <div className="flex justify-center mb-4 animate-float">
              <div className="w-24 h-24 rounded-full border-2 border-gold/60 bg-gradient-to-br from-bronze/40 to-coal flex items-center justify-center">
                <div className="font-display text-4xl text-gold">{initials}</div>
              </div>
            </div>

            <div className="text-center mb-1">
              <div
                className="font-display text-7xl font-light leading-none tracking-tight"
                style={{
                  background: "linear-gradient(180deg, #F5EFE0 0%, #C9A24E 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                <span className="text-2xl text-ash align-top">#</span>
                {memberNumber}
                <span className="text-2xl text-ash align-top">/100</span>
              </div>
            </div>

            <div className="text-center mt-3">
              <div className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-cream">{fullName}</div>
              <div className="font-display italic text-xs text-sand mt-1">{role}</div>
            </div>

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-auto">
              <CardStat label="Lock-ins" value={String(stats.lockIns)} />
              <CardStat label="Status" value={status} accent />
              <CardStat
                label="Vibe level"
                value={
                  <span className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <span
                        key={i}
                        className={"w-1.5 h-1.5 rounded-full " + (i < vibeLevel ? "bg-gold" : "bg-line")}
                      />
                    ))}
                  </span>
                }
              />
              <CardStat label="Vouches" value={stats.vouches + " of 3"} />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-dashed border-line">
              <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-ash">SN — {serial}</div>
              <QRPlaceholder />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 animate-fade-up delay-200">
          <button className="bg-transparent border border-line text-cream font-mono text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 rounded-xl hover:border-gold/40 transition cursor-pointer">
            Share card
          </button>
          <button className="bg-gold text-night font-mono text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition cursor-pointer">
            Add to wallet
          </button>
        </div>

        <div className="text-center font-mono text-[9px] uppercase tracking-[0.25em] text-ash hidden lg:block">
          Move cursor over card → tilt
        </div>

      </div>
    </main>
  );
}

function CardStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-ash mb-1">{label}</div>
      <div className={"font-sans text-sm font-semibold " + (accent ? "text-gold" : "text-cream")}>{value}</div>
    </div>
  );
}

function QRPlaceholder() {
  const pattern = [1,1,1,0,1, 1,0,1,1,1, 1,1,0,1,1, 0,1,1,0,1, 1,1,0,1,1];
  return (
    <div className="w-10 h-10 grid grid-cols-5 gap-px bg-line rounded p-1">
      {pattern.map((on, i) => (
        <div key={i} className={on ? "bg-cream" : "bg-line"} />
      ))}
    </div>
  );
}
