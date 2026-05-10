"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: string;
  ends_at: string | null;
  max_spots: number;
  vibe_theme: string | null;
  status: string;
  rsvp_count: number;
  my_rsvp: boolean;
};

const navItems = [
  { label: "Home", href: "/hq", active: false },
  { label: "Events", href: "/events", active: true },
  { label: "Squad", href: "/squad", active: false },
  { label: "Vault", href: "/vault", active: false },
  { label: "Me", href: "/me", active: false },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [profile, setProfile] = useState<{ member_number: number; full_name: string; is_admin: boolean } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pulling, setPulling] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: me } = await supabase
        .from("members")
        .select("member_number, full_name, is_admin")
        .eq("id", user.id)
        .single();
      if (me) setProfile(me);

      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });

      if (!eventsData) return;

      const enriched = await Promise.all(eventsData.map(async (ev) => {
        const { count } = await supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", ev.id)
          .eq("status", "locked_in");
        const { data: myRsvp } = await supabase
          .from("rsvps")
          .select("id")
          .eq("event_id", ev.id)
          .eq("member_id", user.id)
          .eq("status", "locked_in")
          .maybeSingle();
        return { ...ev, rsvp_count: count || 0, my_rsvp: !!myRsvp };
      }));

      setEvents(enriched);
    };
    init();

    const channel = supabase
      .channel("events-page-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, () => init())
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => init())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePullUp = async (eventId: string, currentlyLockedIn: boolean) => {
    if (!userId || pulling) return;
    setPulling(eventId);
    const supabase = createClient();
    if (currentlyLockedIn) {
      await supabase.from("rsvps").delete().eq("event_id", eventId).eq("member_id", userId);
    } else {
      await supabase.from("rsvps").insert({ event_id: eventId, member_id: userId, status: "locked_in" });
    }
    setPulling(null);
  };

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const now = Date.now();
  const upcoming = events.filter(e => new Date(e.starts_at).getTime() >= now);
  const past = events.filter(e => new Date(e.starts_at).getTime() < now);

  const myFirstName = profile?.full_name.split(" ")[0] ?? "";
  const myFullName = profile?.full_name ?? "Loading...";
  const myNumber = profile ? String(profile.member_number).padStart(3, "0") : "...";

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
            <Link key={item.label} href={item.href}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer " + (item.active ? "bg-stone text-gold" : "text-sand hover:bg-coal hover:text-cream")}>
              <span className={"w-1.5 h-1.5 rounded-full " + (item.active ? "bg-gold" : "bg-ash")}></span>
              <span className="font-sans text-sm font-medium tracking-wide">{item.label}</span>
            </Link>
          ))}
          {profile?.is_admin && (
            <Link href="/admin/events" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer text-ember hover:bg-coal mt-2 border-t border-line pt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-ember"></span>
              <span className="font-sans text-sm font-medium tracking-wide">Admin</span>
            </Link>
          )}
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
        <button onClick={handleLogout} className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-ash hover:text-ember transition text-left cursor-pointer">
          ← Sign out
        </button>
      </aside>

      <main className="flex-1 max-w-md lg:max-w-none mx-auto px-5 lg:px-12 pt-6 lg:pt-12 pb-28 lg:pb-12">

        <header className="mb-8 lg:mb-10 animate-fade-up flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3 flex items-center gap-2">
              <span className="h-px w-6 bg-gold"></span><span>Events</span>
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-light tracking-tight leading-[0.95]">
              The <em className="text-gold">calendar.</em>
            </h1>
            <p className="text-sand text-sm lg:text-base mt-3">
              {upcoming.length} upcoming · {past.length} past
            </p>
          </div>
          {profile?.is_admin && (
            <Link href="/admin/events" className="bg-ember text-night font-mono text-xs font-bold uppercase tracking-[0.2em] px-5 py-3 rounded-xl hover:brightness-110 transition cursor-pointer">
              + New event
            </Link>
          )}
        </header>

        {upcoming.length > 0 && (
          <section className="mb-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-4">Upcoming</div>
            <div className="grid gap-3 lg:gap-4 lg:grid-cols-2">
              {upcoming.map((ev, i) => (
                <EventCard key={ev.id} event={ev} onToggle={handlePullUp} pulling={pulling === ev.id} delay={i} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-4">Memory lane</div>
            <div className="grid gap-2 lg:gap-3 lg:grid-cols-3">
              {past.map((ev, i) => (
                <PastEventCard key={ev.id} event={ev} delay={i} />
              ))}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="border border-dashed border-line/60 rounded-2xl p-12 lg:p-20 text-center">
            <div className="text-6xl mb-4 opacity-30">📅</div>
            <h2 className="font-display text-2xl lg:text-3xl font-light text-cream mb-2">No events yet.</h2>
            <p className="text-sand text-sm">{profile?.is_admin ? "Create the first one." : "Check back soon."}</p>
          </div>
        )}

      </main>

      <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-coal/95 backdrop-blur-xl border-t border-line px-4 pt-3 flex justify-around z-50"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {navItems.map(item => (
          <Link key={item.label} href={item.href}
            className={"flex flex-col items-center gap-1.5 cursor-pointer transition " + (item.active ? "text-gold" : "text-ash hover:text-sand")}>
            <div className={"rounded-full " + (item.active ? "w-1.5 h-1.5 bg-gold shadow-[0_0_8px_currentColor]" : "w-1 h-1 bg-current")}></div>
            <span className="font-mono text-[8px] uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function EventCard({ event, onToggle, pulling, delay }: { event: EventRow; onToggle: (id: string, locked: boolean) => void; pulling: boolean; delay: number }) {
  const date = new Date(event.starts_at);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const fillPercent = Math.min(100, (event.rsvp_count / event.max_spots) * 100);

  return (
    <div className="bg-coal border border-line rounded-2xl p-5 lg:p-6 relative overflow-hidden animate-fade-up hover:border-gold/40 transition"
      style={{ animationDelay: Math.min(delay * 60, 400) + "ms" }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"></div>
      <div className="absolute inset-0 holographic pointer-events-none opacity-30"></div>
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-stone border border-line rounded-xl px-3 py-2 text-center shrink-0">
            <div className="font-mono text-[9px] uppercase tracking-widest text-gold">{month}</div>
            <div className="font-display text-3xl font-light text-cream leading-none mt-0.5">{day}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl lg:text-2xl font-normal leading-tight">{event.title}</h3>
            <div className="text-xs text-sand mt-1">{time} · {event.location}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 font-mono text-[9px] uppercase tracking-widest">
            <span className="text-ash"><span className="text-cream font-bold">{event.rsvp_count}</span> / {event.max_spots} confirmed</span>
            <span className="text-gold">{Math.round(fillPercent)}%</span>
          </div>
          <div className="h-1 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all duration-500" style={{ width: fillPercent + "%" }}></div>
          </div>
        </div>

        <button onClick={() => onToggle(event.id, event.my_rsvp)} disabled={pulling}
          className={"w-full font-mono text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition cursor-pointer disabled:opacity-50 " + (event.my_rsvp ? "bg-bronze text-cream" : "bg-gold text-night hover:brightness-110 active:scale-[0.98]")}>
          {pulling ? "..." : (event.my_rsvp ? "✓ Locked in" : "Pull up")}
        </button>
      </div>
    </div>
  );
}

function PastEventCard({ event, delay }: { event: EventRow; delay: number }) {
  const date = new Date(event.starts_at);
  const formatted = date.toLocaleDateString("en-US", { day: "numeric", month: "short" });

  return (
    <div className="bg-coal/40 border border-line rounded-xl p-4 animate-fade-up opacity-70 hover:opacity-100 transition cursor-pointer"
      style={{ animationDelay: Math.min(delay * 40, 300) + "ms" }}>
      <div className="font-mono text-[9px] uppercase tracking-widest text-ash mb-1">{formatted}</div>
      <div className="font-display text-base font-normal truncate">{event.title}</div>
      <div className="font-mono text-[9px] text-gold mt-1">{event.rsvp_count} attended</div>
    </div>
  );
}
