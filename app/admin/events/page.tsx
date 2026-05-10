"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

type EventRow = {
  id: string;
  title: string;
  location: string;
  starts_at: string;
  max_spots: number;
  status: string;
  description: string | null;
  vibe_theme: string | null;
};

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ member_number: number; full_name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    starts_at: "",
    max_spots: "100",
    vibe_theme: "",
  });

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: me } = await supabase
        .from("members")
        .select("member_number, full_name, is_admin")
        .eq("id", user.id)
        .single();

      if (!me?.is_admin) {
        router.push("/events");
        return;
      }
      setProfile({ member_number: me.member_number, full_name: me.full_name });
      setIsAdmin(true);
      setAuthChecked(true);

      const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
      if (data) setEvents(data);
    };
    init();
  }, [router]);

  const refreshEvents = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
    if (data) setEvents(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || submitting) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      location: form.location,
      starts_at: new Date(form.starts_at).toISOString(),
      max_spots: parseInt(form.max_spots) || 100,
      vibe_theme: form.vibe_theme || null,
      created_by: userId,
      status: "upcoming",
    });

    if (!error) {
      setForm({ title: "", description: "", location: "", starts_at: "", max_spots: "100", vibe_theme: "" });
      setShowForm(false);
      await refreshEvents();
    } else {
      alert("Error: " + error.message);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm("Delete \"" + title + "\"? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    await refreshEvents();
  };

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-widest text-ash">Checking access...</div>
      </main>
    );
  }

  const myFirstName = profile?.full_name.split(" ")[0] ?? "";
  const myFullName = profile?.full_name ?? "";
  const myNumber = profile ? String(profile.member_number).padStart(3, "0") : "...";

  return (
    <div className="min-h-screen lg:flex">

      <aside className="hidden lg:flex flex-col w-72 border-r border-line p-8 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 animate-fade-up">
          <Logo size="sm" glow />
          <div>
            <Wordmark className="text-2xl" />
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash mt-0.5">Admin Panel</div>
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ember mb-12 mt-3">Founder access · #{myNumber}</div>

        <nav className="flex flex-col gap-1">
          <Link href="/hq" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer text-sand hover:bg-coal hover:text-cream">
            <span className="w-1.5 h-1.5 rounded-full bg-ash"></span>
            <span className="font-sans text-sm font-medium">← Back to HQ</span>
          </Link>
          <div className="border-t border-line my-3 pt-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ember mb-2 px-3">Admin</div>
            <Link href="/admin/events" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-stone text-ember">
              <span className="w-1.5 h-1.5 rounded-full bg-ember"></span>
              <span className="font-sans text-sm font-medium">Events</span>
            </Link>
          </div>
        </nav>

        <button onClick={handleLogout} className="mt-auto font-mono text-[9px] uppercase tracking-[0.25em] text-ash hover:text-ember transition text-left cursor-pointer">
          ← Sign out
        </button>
      </aside>

      <main className="flex-1 max-w-md lg:max-w-none mx-auto px-5 lg:px-12 pt-6 lg:pt-12 pb-28 lg:pb-12">

        <header className="mb-8 lg:mb-10 animate-fade-up flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ember mb-3 flex items-center gap-2">
              <span className="h-px w-6 bg-ember"></span><span>Admin · Events</span>
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-light tracking-tight leading-[0.95]">
              Plan the <em className="text-gold">cruise.</em>
            </h1>
            <p className="text-sand text-sm lg:text-base mt-3">{events.length} event{events.length !== 1 ? "s" : ""} total</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] px-5 py-3 rounded-xl hover:brightness-110 transition cursor-pointer">
            {showForm ? "Cancel" : "+ New event"}
          </button>
        </header>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-coal border border-line rounded-2xl p-6 mb-8 animate-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-4">Create new event</div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Title" required>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="All-White Picnic" className={inputClass} />
              </Field>
              <Field label="Location" required>
                <input type="text" required value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Bonny Camp Beach" className={inputClass} />
              </Field>
              <Field label="Starts at" required>
                <input type="datetime-local" required value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})}
                  className={inputClass} />
              </Field>
              <Field label="Max spots">
                <input type="number" min="1" max="100" value={form.max_spots} onChange={e => setForm({...form, max_spots: e.target.value})}
                  className={inputClass} />
              </Field>
              <Field label="Vibe theme">
                <input type="text" value={form.vibe_theme} onChange={e => setForm({...form, vibe_theme: e.target.value})}
                  placeholder="all_white, cinema, casual..." className={inputClass} />
              </Field>
              <Field label="Description" full>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Tell members what to expect..." rows={3} className={inputClass + " resize-none"} />
              </Field>
            </div>
            <button type="submit" disabled={submitting} className="mt-5 bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl hover:brightness-110 transition cursor-pointer disabled:opacity-50">
              {submitting ? "Creating..." : "Publish event →"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="border border-dashed border-line/60 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-3 opacity-30">📅</div>
              <p className="text-sand">No events yet. Create the first.</p>
            </div>
          ) : events.map(ev => (
            <div key={ev.id} className="bg-coal border border-line rounded-xl p-4 lg:p-5 flex items-center justify-between gap-4 hover:border-gold/40 transition">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-widest text-gold mb-1">
                  {new Date(ev.starts_at).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </div>
                <div className="font-display text-lg lg:text-xl font-normal truncate">{ev.title}</div>
                <div className="font-sans text-xs text-sand truncate">{ev.location}</div>
              </div>
              <button onClick={() => handleDelete(ev.id, ev.title)}
                className="font-mono text-[10px] uppercase tracking-widest text-ember hover:text-cream hover:bg-ember/20 px-3 py-2 rounded-lg transition cursor-pointer shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

const inputClass = "w-full bg-night border border-line rounded-lg px-3 py-2.5 text-cream text-sm placeholder:text-ash focus:border-gold/40 focus:outline-none transition";

function Field({ label, children, required, full }: { label: string; children: React.ReactNode; required?: boolean; full?: boolean }) {
  return (
    <div className={full ? "lg:col-span-2" : ""}>
      <label className="font-mono text-[9px] uppercase tracking-[0.25em] text-ash block mb-1.5">
        {label}{required && <span className="text-ember"> *</span>}
      </label>
      {children}
    </div>
  );
}
