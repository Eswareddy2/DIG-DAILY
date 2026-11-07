import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getHomeFeed } from "@/lib/news.functions";
import { PageShell, BreakingTicker, LiveDot, LocalizedTitle } from "@/components/news/SiteChrome";
import { ArticleCard } from "@/components/news/ArticleCard";
import { TimeAgo } from "@/components/news/TimeAgo";
import { pickText, useLang } from "@/lib/lang";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ViralSuperMart — Live Digital Marketing News" },
      {
        name: "description",
        content:
          "Live digital marketing news: SEO, paid ads, social media, AI marketing and algorithm updates, auto-collected from official sources every 2 minutes.",
      },
      { property: "og:title", content: "ViralSuperMart — Live Digital Marketing News" },
      {
        property: "og:description",
        content: "Breaking SEO, ads, social and AI marketing news, refreshed every 2 minutes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://viralsupermart.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://viralsupermart.com/" }],
  }),
  loader: () => getHomeFeed(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["home-feed"],
    queryFn: () => getHomeFeed(),
    initialData: initial,
    refetchInterval: 120_000,
    refetchIntervalInBackground: true,
  });

  const lang = useLang();
  const articles = data.articles;
  const lead = articles[0];
  const secondary = articles.slice(1, 5);
  const grid = articles.slice(5, 24);
  const breaking = articles.filter((a) => a.is_breaking).slice(0, 6);

  return (
    <PageShell categories={data.categories} lastRunAt={data.lastRunAt}>
      <BreakingTicker items={breaking.map((a) => ({ slug: a.slug, title: a.title_hi || a.title }))} />

      {articles.length === 0 ? (
        <p className="py-24 text-center font-serif text-ink-soft">
          The first collection run hasn't landed yet. Stories appear here automatically.
        </p>
      ) : (
        <>
          {/* ── Hero: Lead story + top stories ── */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* Lead story — big image, headline, summary */}
            <div>
              {lead && (
                <article className="group">
                  <ArticleCard article={lead} size="lg" />
                </article>
              )}
            </div>

            {/* Top stories stack — clean list with summaries */}
            <div className="space-y-0 divide-y divide-rule">
              {secondary.map((a) => {
                const { title, summary } = pickText(a, lang);
                return (
                  <article key={a.id} className="group py-4 first:pt-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                      {a.category_slug.replace(/-/g, " ")}
                    </span>
                    <Link to="/article/$slug" params={{ slug: a.slug }}>
                      <h3 className="mt-1 font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-accent line-clamp-2">
                        {title}
                      </h3>
                    </Link>
                    {summary && (
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft line-clamp-2">
                        {summary}
                      </p>
                    )}
                    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span className="font-semibold text-ink-soft truncate max-w-[120px]">{a.source_name}</span>
                      <span>·</span>
                      <TimeAgo iso={a.published_at} />
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ── Latest stories grid — clutter-free cards ── */}
          <h2 className="mt-14 border-b-2 border-accent/20 pb-2 font-display text-xl font-bold text-ink">
            Latest Stories
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
