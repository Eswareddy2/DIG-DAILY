import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft, ShieldCheck, RefreshCw, Pause, Play, Languages, Eye, Newspaper, Rss, Activity, AlertTriangle, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMyAdminStatus, claimFirstAdmin, getAdminOverview, forceRefresh, setCollectorPaused, backfillHindi,
} from "@/lib/admin.functions";
import { getReaderAnalytics } from "@/lib/analytics.functions";
import { TimeAgo } from "@/components/news/TimeAgo";
import { DigestPanel, SourcesPanel, StoriesPanel } from "@/components/admin/AdminPanels";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Center — ViralSuperMart" },
      { name: "description", content: "Manage ViralSuperMart stories, sources, and collection operations." },
      { property: "og:title", content: "Admin Control Center — ViralSuperMart" },
      { property: "og:description", content: "Manage ViralSuperMart stories, sources, and collection operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Eye }) {
  return (
    <div className="border border-rule bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" /> {label}
      </div>
      <p className="mt-2 font-display text-3xl font-black text-primary">{value}</p>
    </div>
  );
}

function AdminPage() {
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(getMyAdminStatus);
  const claimAdmin = useServerFn(claimFirstAdmin);
  const fetchOverview = useServerFn(getAdminOverview);
  const fetchAnalytics = useServerFn(getReaderAnalytics);
  const runRefresh = useServerFn(forceRefresh);
  const runPause = useServerFn(setCollectorPaused);
  const runBackfill = useServerFn(backfillHindi);

  const [activeTab, setActiveTab] = useState<"audience" | "stories" | "sources" | "automation">("audience");
  const [actionNote, setActionNote] = useState("");
  const [busy, setBusy] = useState(false);

  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => checkAdmin(), retry: false });
  const isAdmin = Boolean(status.data?.isAdmin);

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    enabled: isAdmin,
    refetchInterval: 60_000,
  });
  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAnalytics(),
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const isUnauthorized =
    status.error instanceof Error && status.error.message.toLowerCase().includes("unauthorized");

  async function action(fn: () => Promise<unknown>, note: string) {
    setBusy(true);
    setActionNote("");
    try {
      const result = (await fn()) as { translated?: number; remaining?: number; itemsAdded?: number; granted?: boolean; reason?: string } | undefined;
      if (result && "translated" in result) {
        setActionNote(`Translated ${result.translated} stories to Hindi. ${result.remaining ?? 0} still pending.`);
      } else if (result && "itemsAdded" in result) {
        setActionNote(`${note} — ${result.itemsAdded ?? 0} new stories collected.`);
      } else if (result && "granted" in result) {
        setActionNote(result.granted ? "Admin access is ready." : result.reason ?? "Admin access was not granted.");
      } else {
        setActionNote(note);
      }
      await queryClient.invalidateQueries();
    } catch (error) {
      setActionNote(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const paused = Boolean(overview.data?.state?.paused);
  const maxDaily = Math.max(1, ...(analytics.data?.daily.map((d) => d.views) ?? [1]));
  const maxVisitors = Math.max(1, ...(analytics.data?.dailyVisitors.map((d) => d.visitors) ?? [1]));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-ink md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-accent transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to ViralSuperMart
          </a>
          {isAdmin && (
            <span className="text-[11px] font-mono text-muted-foreground border border-rule px-2.5 py-1 bg-card">
              {status.data?.email ? `Admin: ${status.data.email}` : "Verified Admin"}
            </span>
          )}
        </div>

        <div className="mt-8 border-b border-rule pb-5">
          <p className="kicker text-accent">ViralSuperMart newsroom</p>
          <h1 className="mt-2 font-display text-4xl font-black text-ink md:text-5xl">Admin control center</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Manage stories, track audience traffic, monitor automated RSS collection, and control newsroom operations.
          </p>
        </div>

        {!isAdmin && (
          <section className="mt-8 border border-rule bg-card p-6" aria-live="polite">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-accent" />
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  {status.isLoading ? "Checking newsroom access…" : "Admin access required"}
                </h2>
                {isUnauthorized ? (
                  <p className="mt-2 text-sm text-ink-soft">Please sign in with your administrator account before opening the control center.</p>
                ) : status.error ? (
                  <p className="mt-2 text-sm text-destructive">We couldn’t verify this account. Please try again.</p>
                ) : (
                  <p className="mt-2 text-sm text-ink-soft">
                    {status.data?.canClaimAdmin
                      ? "No administrator is assigned yet. Your signed-in account is eligible to initialize newsroom administrator control."
                      : "Strict access control: Only the verified site owner has permission to open this dashboard."}
                  </p>
                )}
              </div>
            </div>
            {status.data?.canClaimAdmin && (
              <Button
                disabled={busy || status.isLoading}
                onClick={() => action(() => claimAdmin(), "Admin setup complete")}
                className="mt-6 rounded-none uppercase tracking-[0.14em]"
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Set up newsroom administrator
              </Button>
            )}
            {(isUnauthorized || status.error) && (
              <Button asChild className="mt-6 rounded-none uppercase tracking-[0.14em]">
                <a href="/auth">Open sign in</a>
              </Button>
            )}
          </section>
        )}

        {isAdmin && (
          <>
            {/* Top Security Banner */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-rule bg-muted/20 px-4 py-2.5 text-xs text-ink-soft">
              <span className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> Strict Access Active: Only you can view or modify newsroom data.
              </span>
              <span className="text-[11px] text-muted-foreground">Session protected via RPC tokens</span>
            </div>

            {/* Quick Actions Bar */}
            <section className="mt-4 flex flex-wrap items-center gap-3 border border-rule bg-card p-3">
              <Button
                disabled={busy}
                size="sm"
                onClick={() => action(() => runRefresh(), "Collection finished")}
                className="rounded-none text-[11px] uppercase tracking-wider"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Collect now
              </Button>
              <Button
                disabled={busy}
                size="sm"
                variant="outline"
                onClick={() => action(() => runPause({ data: { paused: !paused } }), paused ? "Collector resumed" : "Collector paused")}
                className="rounded-none text-[11px] uppercase tracking-wider"
              >
                {paused ? <Play className="mr-1.5 h-3.5 w-3.5" /> : <Pause className="mr-1.5 h-3.5 w-3.5" />}
                {paused ? "Resume collector" : "Pause collector"}
              </Button>
              <Button
                disabled={busy}
                size="sm"
                variant="outline"
                onClick={() => action(() => runBackfill(), "Hindi backfill done")}
                className="rounded-none text-[11px] uppercase tracking-wider"
              >
                <Languages className="mr-1.5 h-3.5 w-3.5" /> Translate next 20 to Hindi
              </Button>
              {actionNote && <p className="w-full text-xs text-ink-soft pt-1" role="status">{actionNote}</p>}
            </section>

            {/* Navigation Tabs */}
            <div className="mt-6 flex gap-6 overflow-x-auto border-b border-rule text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab("audience")}
                className={`pb-3 transition-colors ${
                  activeTab === "audience"
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted-foreground hover:text-ink"
                }`}
              >
                <Activity className="inline-block mr-1.5 h-4 w-4" /> Audience & Traffic
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stories")}
                className={`pb-3 transition-colors ${
                  activeTab === "stories"
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted-foreground hover:text-ink"
                }`}
              >
                <Newspaper className="inline-block mr-1.5 h-4 w-4" /> Manage Posts ({overview.data?.totals.articles ?? "…"})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sources")}
                className={`pb-3 transition-colors ${
                  activeTab === "sources"
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted-foreground hover:text-ink"
                }`}
              >
                <Rss className="inline-block mr-1.5 h-4 w-4" /> RSS Sources ({overview.data?.totals.sources ?? "…"})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("automation")}
                className={`pb-3 transition-colors ${
                  activeTab === "automation"
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted-foreground hover:text-ink"
                }`}
              >
                <RefreshCw className="inline-block mr-1.5 h-4 w-4" /> Engine & Briefs
              </button>
            </div>

            {/* TAB CONTENT: Audience & Traffic */}
            {activeTab === "audience" && (
              <div className="mt-6 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <StatCard label="Total Stories" value={overview.data?.totals.articles ?? "…"} icon={Newspaper} />
                  <StatCard label="Total Reads" value={analytics.data?.totalViews ?? "…"} icon={Eye} />
                  <StatCard label="Reads (24h)" value={analytics.data?.views24h ?? "…"} icon={Activity} />
                  <StatCard label="Visitors (24h)" value={analytics.data?.visitors24h ?? "…"} icon={Users} />
                </div>

                {/* Daily Visitors Chart */}
                <section className="border border-rule bg-card p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-rule">
                    <div>
                      <h2 className="font-display text-xl font-bold text-ink">Daily Unique Visitors</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Track traffic volume across the last 7 days</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-accent">
                      {analytics.data?.visitors7d ?? 0} total (7d)
                    </span>
                  </div>

                  <div className="mt-6 flex h-36 items-end gap-3 pt-4">
                    {(analytics.data?.dailyVisitors ?? []).map((day) => (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-ink-soft">{day.visitors}</span>
                        <div
                          className="w-full bg-accent/80 hover:bg-accent transition-colors"
                          style={{ height: `${Math.max(4, Math.round((day.visitors / maxVisitors) * 95))}px` }}
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">{day.date.slice(5)}</span>
                      </div>
                    ))}
                    {!analytics.data && <p className="text-sm text-muted-foreground">Loading traffic data…</p>}
                  </div>
                </section>

                {/* Reader Analytics & Leaderboard */}
                <section className="border border-rule bg-card p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-rule">
                    <div>
                      <h2 className="font-display text-xl font-bold text-ink">Most-Read Articles</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Top stories driving audience engagement</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-accent">
                      {analytics.data?.views7d ?? 0} reads (7d)
                    </span>
                  </div>

                  {analytics.data && analytics.data.top.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft py-6 text-center">
                      No article reads recorded yet. Views increment the moment a visitor opens a headline.
                    </p>
                  ) : (
                    <ol className="mt-4 divide-y divide-rule">
                      {(analytics.data?.top ?? []).map((item, i) => (
                        <li key={item.id} className="flex items-center justify-between gap-4 py-2.5">
                          <div className="flex items-baseline gap-3 min-w-0">
                            <span className="w-6 shrink-0 font-display text-base font-black text-accent">{i + 1}</span>
                            <Link
                              to="/article/$slug"
                              params={{ slug: item.slug }}
                              className="truncate font-serif text-sm text-ink hover:text-accent transition-colors"
                            >
                              {item.title}
                            </Link>
                          </div>
                          <span className="shrink-0 text-xs font-mono font-bold text-ink-soft bg-muted/40 px-2 py-0.5 border border-rule">
                            {item.views} reads
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            )}

            {/* TAB CONTENT: Posts & Stories */}
            {activeTab === "stories" && (
              <div className="mt-6">
                <StoriesPanel />
              </div>
            )}

            {/* TAB CONTENT: RSS Sources */}
            {activeTab === "sources" && (
              <div className="mt-6 space-y-8">
                {/* Sources Health Table */}
                <section className="border border-rule bg-card p-6">
                  <h2 className="border-b border-rule pb-2 font-display text-xl font-bold text-ink">
                    Source Ingestion Health
                  </h2>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-rule text-[10px] uppercase tracking-widest text-muted-foreground">
                          <th className="py-2 pr-4">Source</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Last Fetch</th>
                          <th className="py-2">Last Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(overview.data?.sources ?? []).map((source) => (
                          <tr key={source.id} className="border-b border-rule/60">
                            <td className="py-2.5 pr-4 font-semibold">{source.name}</td>
                            <td className="py-2.5 pr-4">
                              {source.last_status === "ok" ? (
                                <span className="text-accent font-bold">OK</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-destructive font-medium">
                                  <AlertTriangle className="h-3 w-3" /> {source.last_status ?? "pending"}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                              {source.last_fetched_at ? <TimeAgo iso={source.last_fetched_at} /> : "never"}
                            </td>
                            <td className="max-w-56 truncate py-2.5 text-muted-foreground">{source.last_error ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <SourcesPanel sources={overview.data?.sources ?? []} />
              </div>
            )}

            {/* TAB CONTENT: Engine & Automation */}
            {activeTab === "automation" && (
              <div className="mt-6 space-y-8">
                {/* Collector State & Activity Table */}
                <section className="border border-rule bg-card p-6">
                  <h2 className="border-b border-rule pb-2 font-display text-xl font-bold text-ink">
                    Collection Engine
                  </h2>
                  <p className="mt-3 text-sm text-ink-soft">
                    Automated Ingestion:{" "}
                    <span className={`font-bold ${paused ? "text-destructive" : "text-accent"}`}>
                      {paused ? "Paused" : "Running every 2 minutes"}
                    </span>
                    {overview.data?.state?.last_run_at && (
                      <> · Last run <TimeAgo iso={overview.data.state.last_run_at} /></>
                    )}
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-rule text-[10px] uppercase tracking-widest text-muted-foreground">
                          <th className="py-2 pr-4">Run</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Found</th>
                          <th className="py-2 pr-4">Added</th>
                          <th className="py-2 pr-4">Errors</th>
                          <th className="py-2">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(overview.data?.logs ?? []).slice(0, 10).map((log) => (
                          <tr key={log.id} className="border-b border-rule/60">
                            <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground"><TimeAgo iso={log.started_at} /></td>
                            <td className="py-2.5 pr-4">
                              <span className={log.error_count > 0 ? "text-destructive" : "text-accent font-semibold"}>{log.status}</span>
                            </td>
                            <td className="py-2.5 pr-4">{log.items_found}</td>
                            <td className="py-2.5 pr-4 font-bold text-ink">{log.items_added}</td>
                            <td className="py-2.5 pr-4">{log.error_count}</td>
                            <td className="max-w-56 truncate py-2.5 text-muted-foreground">{log.message ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <DigestPanel />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
