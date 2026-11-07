import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Home, Radio, LayoutGrid, Newspaper, Search, Languages, Shield } from "lucide-react";
import type { Category } from "@/lib/news.functions";
import { trackSiteVisit } from "@/lib/analytics.functions";
import { useIsAdmin } from "@/lib/use-is-admin";
import { pickText, setLang, useLang } from "@/lib/lang";

export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
    </span>
  );
}

export function LanguageToggle() {
  const lang = useLang();
  return (
    <div className="flex items-center border border-rule text-[11px] font-bold uppercase tracking-wider" role="group" aria-label="Language">
      <Languages className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-ink-soft hover:text-accent"}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("hi")}
        className={`px-2 py-1 ${lang === "hi" ? "bg-primary text-primary-foreground" : "text-ink-soft hover:text-accent"}`}
        aria-pressed={lang === "hi"}
      >
        हिंदी
      </button>
    </div>
  );
}

export function BreakingTicker({ items }: { items: { slug: string; title: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex items-center gap-3 overflow-hidden border-y border-rule bg-muted/30 px-3 py-1.5 text-ink">
      <span className="flex shrink-0 items-center gap-1.5 bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
        <LiveDot /> Breaking
      </span>
      <div className="flex gap-8 whitespace-nowrap text-sm font-medium [animation:ticker_38s_linear_infinite]">
        {[...items, ...items].map((item, i) => (
          <Link key={i} to="/article/$slug" params={{ slug: item.slug }} className="hover:text-accent">
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LocalizedTitle({ article }: { article: { title: string; title_hi?: string | null } }) {
  const lang = useLang();
  return <>{pickText(article, lang).title}</>;
}

export function Masthead({ categories }: { categories: Category[] }) {
  const lang = useLang();
  const isAdmin = useIsAdmin();
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, [lang]);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/98 backdrop-blur-sm">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="hidden w-56 text-[11px] uppercase tracking-widest text-muted-foreground md:block font-medium">
            {today}
          </span>
          <Link to="/" className="text-center group">
            <h1 className="font-display text-3xl font-black tracking-tight text-ink md:text-5xl">
              Viral<span className="text-accent">SuperMart</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground font-semibold mt-0.5">
              {lang === "hi" ? "डिजिटल मार्केटिंग न्यूज़" : "Digital Marketing News"}
            </p>
          </Link>
          <div className="flex w-56 items-center justify-end gap-2">
            <Link
              to="/live"
              className="hidden items-center gap-1.5 border border-rule px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent hover:border-accent md:flex transition-colors"
            >
              <LiveDot /> {lang === "hi" ? "लाइव" : "Live"}
            </Link>
            <LanguageToggle />
            <Link to="/search" aria-label={lang === "hi" ? "खोजें" : "Search"} className="p-1.5 text-ink hover:text-accent transition-colors">
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <nav className="scrollbar-none flex gap-6 overflow-x-auto border-t border-rule py-2 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">
          <Link to="/" className="shrink-0 transition-colors hover:text-accent" activeProps={{ className: "!text-accent font-bold" }}>
            {lang === "hi" ? "होम" : "Home"}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="shrink-0 transition-colors hover:text-accent"
              activeProps={{ className: "!text-accent font-bold" }}
            >
              {lang === "hi" && c.name_hi ? c.name_hi : c.name}
            </Link>
          ))}
          <Link to="/digest" className="shrink-0 transition-colors hover:text-accent" activeProps={{ className: "!text-accent font-bold" }}>
            {lang === "hi" ? "डाइजेस्ट" : "Digest"}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="ml-auto hidden shrink-0 items-center gap-1 border border-rule px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft hover:border-accent hover:text-accent md:inline-flex transition-colors"
              aria-label="Admin dashboard"
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const lang = useLang();
  const isAdmin = useIsAdmin();
  const tabs: { to: string; label: string; Icon: typeof Home }[] = [
    { to: "/", label: lang === "hi" ? "होम" : "Home", Icon: Home },
    { to: "/live", label: lang === "hi" ? "लाइव" : "Live", Icon: Radio },
    { to: "/categories", label: lang === "hi" ? "विषय" : "Topics", Icon: LayoutGrid },
    { to: "/digest", label: lang === "hi" ? "डाइजेस्ट" : "Digest", Icon: Newspaper },
    { to: "/search", label: lang === "hi" ? "खोजें" : "Search", Icon: Search },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", Icon: Shield }] : []),
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-rule bg-background md:hidden"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink-soft"
          activeProps={{ className: "text-accent" }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteFooter({ lastRunAt }: { lastRunAt?: string | null | undefined }) {
  return (
    <footer className="mt-16 border-t border-rule bg-muted/25 py-10 text-ink-soft">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-ink">
              Viral<span className="text-accent">SuperMart</span>
            </p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-soft">
              Real-time digital marketing intelligence, breaking updates, and official search news.
            </p>
          </div>
          <div className="text-xs text-muted-foreground md:text-right">
            <p className="font-mono text-[11px] text-ink-soft font-medium">viralsupermart.com</p>
            <p className="mt-1">
              Data last refreshed:{" "}
              {lastRunAt ? new Date(lastRunAt).toLocaleTimeString() : "awaiting first collection"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AdminCta() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return (
    <div className="mx-auto max-w-[1280px] px-4 my-8">
      <Link
        to="/admin"
        className="flex items-center justify-center gap-3 border border-rule bg-muted/30 px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-ink-soft hover:border-accent hover:text-accent transition-colors"
        aria-label="Open admin dashboard"
      >
        <Shield className="h-4 w-4" />
        Admin dashboard
        <span aria-hidden className="text-base leading-none">→</span>
      </Link>
    </div>
  );
}

export function PageShell({
  categories,
  children,
  lastRunAt,
}: {
  categories: Category[];
  children: React.ReactNode;
  lastRunAt?: string | null | undefined;
}) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const recordVisit = useServerFn(trackSiteVisit);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    let visitorId = "";
    try {
      const stored = window.localStorage.getItem("viralsupermart-daily-visitor");
      const parsed = stored ? (JSON.parse(stored) as { day?: string; id?: string }) : null;
      if (parsed?.day === today && parsed.id) {
        visitorId = parsed.id;
      } else {
        visitorId = window.crypto.randomUUID();
        window.localStorage.setItem("viralsupermart-daily-visitor", JSON.stringify({ day: today, id: visitorId }));
      }
    } catch {
      visitorId = window.crypto.randomUUID();
    }

    void recordVisit({ data: { visitorId, path: pathname } }).catch(() => undefined);
  }, [pathname, recordVisit]);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Masthead categories={categories} />
      <main className="mx-auto max-w-[1280px] px-4 py-6">{children}</main>
      <AdminCta />
      <SiteFooter lastRunAt={lastRunAt} />
      <MobileTabBar />
    </div>
  );
}
