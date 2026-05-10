"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

type Photo = {
  id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  uploaded_by: string;
  uploader: { full_name: string; member_number: number } | null;
};

const navItems = [
  { label: "Home", href: "/hq", active: false },
  { label: "Events", href: "/events", active: false },
  { label: "Squad", href: "/squad", active: false },
  { label: "Vault", href: "/vault", active: true },
  { label: "Me", href: "/me", active: false },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h";
  return Math.floor(hours / 24) + "d";
}

export default function VaultPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [myProfile, setMyProfile] = useState<{ member_number: number; full_name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: me } = await supabase.from("members").select("member_number, full_name").eq("id", user.id).single();
        if (me) setMyProfile(me);
      }
      const { data } = await supabase
        .from("photos")
        .select("id, storage_path, caption, created_at, uploaded_by, uploader:members(full_name, member_number)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (data) setPhotos(data as unknown as Photo[]);
    };
    init();

    const channel = supabase
      .channel("vault-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "photos" }, async (payload) => {
        const row = payload.new as { id: string; storage_path: string; caption: string | null; created_at: string; uploaded_by: string };
        const { data: uploader } = await supabase.from("members").select("full_name, member_number").eq("id", row.uploaded_by).single();
        setPhotos(prev => [{ ...row, uploader }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(20);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = user.id + "/" + Date.now() + "." + ext;

    setUploadProgress(50);
    const { error: uploadError } = await supabase.storage.from("vault-photos").upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadProgress(85);
    await supabase.from("photos").insert({
      storage_path: filename,
      uploaded_by: user.id,
    });

    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 400);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const supabase = createClient();
  const getPhotoUrl = (path: string) =>
    supabase.storage.from("vault-photos").getPublicUrl(path).data.publicUrl;

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

        <header className="mb-8 lg:mb-10 animate-fade-up flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold mb-3 flex items-center gap-2">
              <span className="h-px w-6 bg-gold"></span>
              <span>The Vault</span>
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-light tracking-tight leading-[0.95]">
              Every <em className="text-gold">moment.</em>
            </h1>
            <p className="text-sand text-sm lg:text-base mt-3">
              {photos.length} memor{photos.length === 1 ? "y" : "ies"} · uploaded by the squad
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] px-6 py-4 rounded-xl hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden"
          >
            {uploading ? (
              <>
                <div
                  className="absolute inset-0 bg-bronze transition-all duration-300"
                  style={{ width: uploadProgress + "%" }}
                />
                <span className="relative">Uploading {uploadProgress}%</span>
              </>
            ) : (
              <span>+ Drop a memory</span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </header>

        {photos.length === 0 ? (
          <div className="border border-dashed border-line/60 rounded-2xl p-12 lg:p-20 text-center">
            <div className="text-6xl mb-4 opacity-30">📸</div>
            <h2 className="font-display text-2xl lg:text-3xl font-light text-cream mb-2">The vault is empty.</h2>
            <p className="text-sand text-sm mb-6">Be the first to drop a moment.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gold text-night font-mono text-xs font-bold uppercase tracking-[0.2em] px-5 py-3 rounded-xl hover:brightness-110 transition cursor-pointer"
            >
              + Upload first photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
            {photos.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                url={getPhotoUrl(photo.storage_path)}
                animationDelay={i}
              />
            ))}
          </div>
        )}

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

function PhotoCard({ photo, url, animationDelay }: { photo: Photo; url: string; animationDelay: number }) {
  const uploaderFirst = photo.uploader?.full_name.split(" ")[0] ?? "Member";
  const uploaderNum = photo.uploader ? "#" + String(photo.uploader.member_number).padStart(3, "0") : "";

  return (
    <div
      className="group relative aspect-square rounded-xl overflow-hidden bg-coal border border-line cursor-pointer animate-fade-up hover:border-gold/40 hover:scale-[1.02] transition"
      style={{ animationDelay: Math.min(animationDelay * 30, 600) + "ms" }}
    >
      <img
        src={url}
        alt={photo.caption || "G100 vault photo"}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0">
        <div className="font-sans text-xs font-medium text-cream truncate">{uploaderFirst}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-gold">
          {uploaderNum} · {timeAgo(photo.created_at)}
        </div>
      </div>
    </div>
  );
}
