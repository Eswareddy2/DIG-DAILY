import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Newsroom Login — ViralSuperMart" },
      { name: "description", content: "Secure newsroom access for ViralSuperMart editors." },
      { property: "og:title", content: "Newsroom Login — ViralSuperMart" },
      { property: "og:description", content: "Secure newsroom access for ViralSuperMart editors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "sign-up" && !result.data.session) {
      setMessage("Account created. Check your email to confirm access, then sign in.");
      setMode("sign-in");
      return;
    }
    await navigate({ to: "/admin" });
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
          <ArrowLeft className="h-4 w-4" /> ViralSuperMart
        </Link>
        <div className="max-w-lg">
          <Newspaper className="mb-6 h-10 w-10 text-accent" />
          <p className="kicker text-accent">The newsroom</p>
          <h1 className="mt-3 font-display text-6xl font-black leading-[0.98]">Every signal. One clear desk.</h1>
          <p className="mt-6 max-w-md font-serif text-xl text-primary-foreground/75">
            Review the latest collection, shape the front page, and keep ViralSuperMart moving.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/55">ViralSuperMart Editorial Operations</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-accent lg:hidden">
            <ArrowLeft className="h-4 w-4" /> Back to ViralSuperMart
          </Link>
          <div className="mb-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <p className="kicker text-accent">Private access</p>
            <h2 className="mt-2 font-display text-4xl font-black text-primary">
              {mode === "sign-in" ? "Welcome back" : "Join the desk"}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">Sign in to manage stories, sources, and the collection run.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold text-ink">
              Email address
              <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 rounded-none" />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Password
              <div className="relative mt-1.5">
                <Input required minLength={6} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-none pr-11" />
                <Button type="button" variant="ghost" size="icon" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1 h-9 w-9">
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </label>
            {message && <p role="alert" className="border-l-2 border-accent bg-secondary px-3 py-2 text-sm text-ink">{message}</p>}
            <Button disabled={busy} type="submit" className="h-11 w-full rounded-none uppercase tracking-[0.16em]">
              {busy ? "Checking…" : mode === "sign-in" ? "Enter newsroom" : "Create account"}
            </Button>
          </form>
          <button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }} className="mt-5 text-sm font-semibold text-accent hover:underline">
            {mode === "sign-in" ? "Need an editor account? Create one" : "Already have access? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}