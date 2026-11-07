import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLiveFeed, getCategories } from "@/lib/news.functions";
import { PageShell, LiveDot } from "@/components/news/SiteChrome";
import { LiveChat } from "@/components/news/LiveChat";
import { TimeAgo } from "@/components/news/TimeAgo";
import { pickText, useLang } from "@/lib/lang";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Feed — ViralSuperMart" },
      {
        name: "description",
        content: "The live wire of digital marketing news, updating automatically every 2 minutes.",
      },
      { property: "og:title", content: "Live Feed — ViralSuperMart" },
      { property: "og:description", content: "Digital marketing headlines as they break." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://viralsupermart.com/live" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://viralsupermart.com/live" }],
  }),
  loader: async () => {
    const [feed, cats] = await Promise.all([getLiveFeed(), getCategories()]);
    return { feed, categories: cats.categories };
  },
  component: LivePage,
});

/** Truncate to a short attention-grabbing summary. */
function shortSummary(text: string | null, maxLen = 140): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

function LivePage() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["live-feed"],
    queryFn: () => getLiveFeed(),
    initialData: initial.feed,
    refetchInterval: 120_000,
    refetchIntervalInBackground: true,
  });
  const lang = useLang();

  return (
    <PageShell categories={initial.categories} lastRunAt={data.lastRunAt}>
      <div className="flex items-center gap-3 border-b border-rule pb-3">
        <LiveDot />
        <h1 className="font-display text-3xl font-bold text-ink">Live Feed</h1>
        <span className="ml-auto text-xs uppercase tracking-widest text-muted-foreground">
          Auto-refreshing every 2 min
        </span>
      </div>
      <ol className="mt-6 space-y-5 border-l-2 border-rule pl-5">
        {data.articles.map((a) => {
          const { title, summary } = pickText(a, lang);
          const brief = shortSummary(summary);
          return (
            <li key={a.id} className="relative">
              <span className="absolute -left-[27px] top-2 h-2.5 w-2.5 rounded-full bg-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                <TimeAgo iso={a.published_at} /> · {a.category_slug.replace(/-/g, " ")}
              </p>
              <Link
                to="/article/$slug"
                params={{ slug: a.slug }}
                className="font-display text-lg font-bold leading-snug text-ink hover:text-accent"
              >
                {title}
              </Link>
              {brief && <p className="mt-0.5 text-sm text-ink-soft line-clamp-2">{brief}</p>}
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{a.source_name}</p>
            </li>
          );
        })}
      </ol>
      <LiveChat />
    </PageShell>
  );
}
