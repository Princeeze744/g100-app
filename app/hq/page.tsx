"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

type MemberProfile = {
  id: string;
  member_number: number;
  full_name: string;
  role: string | null;
  vibe_score: number;
};

type EventRow = {
  id: string;
  title: string;
  location: string;
  starts_at: string;
  max_spots: number;
};

type ActivityRow = {
  id: string;
  type: string;
  metadata: { event_title?: string; member_number?: number } | null;
  created_at: string;
  member: { full_name: string; member_number: number } | null;
};

const recentMoments = [
  "from-[#4a3520] to-[#1a1308]",
  "from-[#2a3a4a] to-[#08141a]",
  "from-[#4a2030] to-[#1a0810]",
  "from-[#3a4a20] to-[#0a1a08]",
  "from-[#4a3a20] to-[#1a1408]",
  "from-[#2a2a4a] to-[#08081a]",
];

const navItems = [
  { label: "Home", href: "/hq", active: true },
  { label: "Events", href: "/events" },
  { label: "Squad", href: "/squad" },
  { label: "Vault", href: "/vault" },
  { label: "Me", href: "/me" },
];

function useCountdown(targetTime: number | null) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!targetTime) return;
    const tick = () => {
      const dist = targetTime - Date.now();
      if (dist < 0) {
        setT({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
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
  }, [targetTime]);
  return t;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h";
  return Math.floor(hours / 24) + "d";
}

function activityText(a: ActivityRow): string {
  switch (a.type) {
    case "joined": return "joined the squad";
    case "rsvp": return "locked in for " + (a.metadata?.event_title || "an event");
    case "photo_upload": return "uploaded photos to the vault";
    case "vouch": return "vouched for a new member";
    case "vote": return "voted in the awards";
    default: return "did something";
  }
}

export default function HangoutHQ() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState({ lockIns: 0, vouches: 0 });
  const [event, setEvent] = useState<EventRow | null>(null);
  const [confirmed, setConfirmed] = useState(0);
  const [lockedIn, setLockedIn] = useState(false);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [pulling, setPulling] = useState(false);

  const eventDate = event ? new Date(event.starts_at) : null;
  const cd = useCountdown(eventDate ? eventDate.getTime() : null);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("members")
        .select("id, member_number, full_name, role, vibe_score")
        .eq("id", user.id)
        .single();
      if (profileData) setProfile(profileData);

      const [lockInsRes, vouchesRes] = await Promise.all([
        supabase.from("rsvps").select("*", { count: "exact", head: true }).eq("member_id", user.id).eq("status", "locked_in"),
        supabase.from("vouches").select("*", { count: "exact", head: true }).eq("vouched_for_id", user.id),
      ]);
      setStats({ lockIns: lockInsRes.count || 0, vouches: vouchesRes.count || 0 });

      const { data: events } = await supabase
        .from("events")
        .select("id, title, location, starts_at, max_spots")
        .eq("status", "upcoming")
        .order("starts_at", { ascending: true })
        .limit(1);

      if (events && events[0]) {
        const ev = events[0];
        setEvent(ev);

        const { count } = await supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", ev.id)
          .eq("status", "locked_in");
        setConfirmed(count || 0);

        const { data: myRsvp } = await supabase
          .from("rsvps")
          .select("id")
          .eq("event_id", ev.id)
          .eq("member_id", user.id)
          .eq("status", "locked_in")
          .maybeSingle();
        setLockedIn(!!myRsvp);
      }

      const { data: acts } = await supabase
        .from("activities")
        .select("id, type, metadata, created_at, member:members(full_name, member_number)")
        .order("created_at", { ascending: false })
        .limit(4);
      if (acts) setActivities(acts as unknown as ActivityRow[]);
    };

    init();
  }, []);

  useEffect(() => {
    if (!event) return;
    const supabase = createClient();

    const rsvpChannel = supabase
      .channel("rsvps-" + event.id)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "rsvps",
        filter: "event_id=eq." + event.id,
      }, async () => {
        const { count } = await supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .eq("status", "locked_in");
        setConfirmed(count || 0);
      })
      .subscribe();

    const activityChannel = supabase
      .channel("activities-live")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "activities",
      }, async (payload) => {
        const row = payload.new as { id: string; type: string; metadata: unknown; created_at: string; member_id: string };
        const { data: member } = await supabase
          .from("members")
          .select("full_name, member_number")
          .eq("id", row.member_id)
          .single();
        setActivities(prev => [{
          id: row.id,
          type: row.type,
          metadata: row.metadata as ActivityRow["metadata"],
          created_at: row.created_at,
          member: member,
        }, ...prev.slice(0, 3)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rsvpChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [event?.id]);

  const handlePullUp = async () => {
    if (!event || !profile || pulling) return;
    setPulling(true);
    const supabase = createClient();
    if (lockedIn) {
      await supabase.from("rsvps").delete().eq("event_id", event.id).eq("member_id", profile.id);
      setLockedIn(false);
    } else {
      await supabase.from("rsvps").insert({ event_id: event.id, member_id: profile.id, status: "locked_in" });
      setLockedIn(true);
    }
    setPulling(false);
  };

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const firstName = profile?.full_name.split(" ")[0] ?? "";
  const surname = profile?.full_name.split(" ").slice(1).join(" ") ?? "";
  const fullName = profile?.full_name ?? "";
  const memberNumber = profile ? String(profile.member_number).padStart(3, "0") : "...";

  const formattedDate = eventDate?.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" });
  const formattedTime = eventDate?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen lg:flex">

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
              {firstName[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm text-cream font-medium truncate group-hover:text-gold transition">{fullName || "Loading..."}</div>
              <div className="font-mono text-[10px] text-gold tracking-wider">#{memberNumber}</div>
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

      <main className="flex-1 max-w-md lg:max-w-none mx-auto px-5 lg:px-12 pt-6 lg:pt-12 pb-28 lg:pb-12 flex flex-col gap-4 lg:gap-6">

        <header className="flex lg:hidden items-start justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash mb-1">Welcome back</div>
            <h1 className="font-display text-3xl font-normal tracking-tight">{firstName || "..."}</h1>
          </div>
          <div className="flex items-center gap-2 bg-coal border border-line rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
            <span className="font-mono text-[11px] font-bold text-gold tracking-wider">#{memberNumber}</span>
          </div>
        </header>

        <header className="hidden lg:flex items-end justify-between mb-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-3">Welcome back</div>
            <h1 className="font-display text-5xl font-light tracking-tight">
              {firstName || "..."} {surname && <em className="text-gold">{surname}.</em>}
            </h1>
          </div>
          <div className="font-mono text-xs text-ash uppercase tracking-[0.2em]">{today}</div>
        </header>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

          <div className="lg:col-span-2 bg-coal border border-line rounded-2xl p-5 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"></div>
            <div className="absolute inset-0 holographic pointer-events-none opacity-50"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-gold animate-ping opacity-75"></span>
                  <span className="relative rounded-full w-2 h-2 bg-gold"></span>
                </span>
                <span className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.25em] text-gold">Next up</span>
              </div>

              {event ? (
                <>
                  <h2 className="font-display text-3xl lg:text-5xl leading-tight font-normal mb-3">{event.title}</h2>
                  <div className="text-xs lg:text-sm text-sand mb-5 leading-relaxed">
                    <div>{formattedDate} · {formattedTime}</div>
                    <div>{event.location}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-5 py-4 border-y border-line">
                    <CountdownCell value={cd.d} label="Days" />
                    <CountdownCell value={cd.h} label="Hrs" />
                    <CountdownCell value={cd.m} label="Min" />
                    <CountdownCell value={cd.s} label="Sec" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-[9px] lg:text-[10px] uppercase tracking-widest text-ash">
                      <span className="text-cream font-bold">{confirmed}</span> / {event.max_spots} confirmed
                    </div>
                    <button
                      onClick={handlePullUp}
                      disabled={pulling}
                      className={"font-mono text-[10px] lg:text-xs font-bold uppercase tracking-widest px-4 lg:px-6 py-2 lg:py-3 rounded-full transition-all active:scale-95 cursor-pointer disabled:opacity-50 " + (lockedIn ? "bg-bronze text-cream" : "bg-gold text-night hover:brightness-110")}
                    >
                      {pulling ? "..." : (lockedIn ? "✓ Locked in" : "Pull up")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <h2 className="font-display text-2xl lg:text-3xl font-light text-sand mb-2">Loading next hangout...</h2>
                  <p className="text-xs text-ash">Fetching from the squad's calendar</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-coal border border-line rounded-2xl p-5 lg:p-6 relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-ember animate-ping opacity-75"></span>
                <span className="relative rounded-full w-2 h-2 bg-ember"></span>
              </span>
              <span className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.25em] text-ember">Live activity</span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {activities.length === 0 ? (
                <div className="text-xs text-ash py-4">No activity yet. Be the first to lock in!</div>
              ) : activities.map(a => (
                <div key={a.id} className="flex gap-3 animate-[fadeIn_0.5s_ease-out]">
                  <div className="w-8 h-8 rounded-full bg-stone border border-line flex items-center justify-center font-mono text-[10px] text-gold shrink-0">
                    {a.member?.full_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs lg:text-sm text-cream leading-snug">
                      <span className="font-medium text-gold">{a.member?.full_name?.split(" ")[0] || "Someone"}</span>
                      <span className="text-sand"> {activityText(a)}</span>
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-ash mt-1">
                      {a.member?.member_number ? "#" + String(a.member.member_number).padStart(3, "0") : ""} · {timeAgo(a.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <StatCard label="Lock-ins" value={String(stats.lockIns)} />
          <StatCard label="Vibe score" value={profile?.vibe_score ? profile.vibe_score.toFixed(1) : "—"} accent />
          <StatCard label="Vouches" value={String(stats.vouches)} />
          <StatCard label="Awards" value="0" accent />
        </div>

        <div className="mt-2">
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.25em] text-ash">From the vault — soon</div>
            <button className="font-mono text-[9px] lg:text-[10px] uppercase tracking-[0.2em] text-gold hover:brightness-110 cursor-pointer">View all</button>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 lg:gap-3">
            {recentMoments.map((g, i) => (
              <div key={i} className={"aspect-square rounded-lg lg:rounded-xl border border-line bg-gradient-to-br " + g + " relative overflow-hidden cursor-pointer hover:border-gold/40 hover:scale-[1.02] transition"}>
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
            className={"flex flex-col items-center gap-1.5 cursor-pointer transition " + (item.active ? "text-gold" : "text-ash hover:text-sand")}
          >
            <div className={"rounded-full " + (item.active ? "w-1.5 h-1.5 bg-gold shadow-[0_0_8px_currentColor]" : "w-1 h-1 bg-current")}></div>
            <span className="font-mono text-[8px] uppercase tracking-widest">{item.label}</span>
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
      <div className="font-mono text-[8px] lg:text-[9px] uppercase tracking-widest text-ash mt-1.5 lg:mt-2">{label}</div>
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-coal border border-line rounded-xl px-3 py-3 lg:px-5 lg:py-4">
      <div className="font-mono text-[8px] lg:text-[10px] uppercase tracking-[0.2em] text-ash mb-1.5">{label}</div>
      <div className={"font-display text-2xl lg:text-3xl font-normal leading-none " + (accent ? "text-gold" : "text-cream")}>{value}</div>
    </div>
  );
}
