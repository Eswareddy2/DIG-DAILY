import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { supabase, isSampleMode } from "@/integrations/supabase/client";
import { useLang } from "@/lib/lang";
import { LiveDot } from "@/components/news/SiteChrome";
import { TimeAgo } from "@/components/news/TimeAgo";
import { useIsAdmin } from "@/lib/use-is-admin";
import { deleteChatMessage } from "@/lib/admin.functions";

type ChatMessage = { id: string; display_name: string; body: string; created_at: string };

const MAX_BODY = 500;
const COOLDOWN_SECONDS = 15;

export function LiveChat() {
  const lang = useLang();
  const isAdmin = useIsAdmin();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setName(window.localStorage.getItem("viralsupermart-chat-name") ?? window.localStorage.getItem("digidaily-chat-name") ?? "");
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (isSampleMode) return;
    let cancelled = false;

    void supabase
      .from("chat_messages")
      .select("id,display_name,body,created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!cancelled && data) setMessages((data as ChatMessage[]).slice().reverse());
      });

    const channel = supabase
      .channel(`chat-messages-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const row = payload.new as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev.slice(-79), row]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function post() {
    if (isSampleMode) {
      setError("Chat is unavailable in sample mode. No message was saved.");
      return;
    }
    const text = body.trim();
    if (!text || sending || cooldown > 0) return;
    setSending(true);
    setError("");
    const displayName = name.trim().slice(0, 40) || "Guest";
    try {
      window.localStorage.setItem("viralsupermart-chat-name", displayName);
    } catch {
      /* storage unavailable */
    }
    const { error: insertError } = await supabase
      .from("chat_messages")
      .insert({ display_name: displayName, body: text.slice(0, MAX_BODY) });
    if (insertError) {
      setError(insertError.message);
    } else {
      setBody("");
      setCooldown(COOLDOWN_SECONDS);
    }
    setSending(false);
  }

  async function remove(id: string) {
    try {
      await deleteChatMessage({ data: { id } });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError(lang === "hi" ? "हटाने में समस्या" : "Could not delete message");
    }
  }

  return (
    <section className="mt-10 border border-rule bg-card" aria-label="Live chat">
      <div className="flex items-center gap-2 border-b border-rule bg-primary px-4 py-2 text-primary-foreground">
        <LiveDot />
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">
          {lang === "hi" ? "लाइव चैट — अपनी राय दें" : "Live chat — share your opinion"}
        </h2>
      </div>

      <div ref={listRef} className="max-h-96 min-h-24 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-6 text-center font-serif text-sm text-ink-soft">
            {lang === "hi" ? "पहली राय आपकी हो सकती है…" : "Be the first to share an opinion…"}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="group flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {m.display_name} <span className="font-normal text-muted-foreground">· <TimeAgo iso={m.created_at} /></span>
              </p>
              <p className="font-serif text-sm break-words text-ink">{m.body}</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => void remove(m.id)}
                aria-label="Delete message"
                className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-rule px-4 py-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder={lang === "hi" ? "आपका नाम" : "Your name"}
          aria-label="Display name"
          className="w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent sm:w-40"
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void post();
          }}
          maxLength={MAX_BODY}
          placeholder={lang === "hi" ? "अपनी राय लिखें…" : "Write your opinion…"}
          aria-label="Chat message"
          className="min-w-0 flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void post()}
          disabled={sending || cooldown > 0 || body.trim().length === 0}
          className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {cooldown > 0 ? `${cooldown}s` : lang === "hi" ? "भेजें" : "Post"}
        </button>
      </div>
      {error && <p className="px-4 pb-2 text-xs text-destructive">{error}</p>}
    </section>
  );
}
