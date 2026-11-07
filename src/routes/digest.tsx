import { createFileRoute, Link } from "@tanstack/react-router";
import { getDigest, getCategories } from "@/lib/news.functions";
import { PageShell } from "@/components/news/SiteChrome";
import { TimeAgo } from "@/components/news/TimeAgo";
import { pickText, useLang } from "@/lib/lang";

export const Route = createFileRoute("/digest")({
  head: () => ({
    meta: [
      { title: "Daily Digest — ViralSuperMart" },
      {
        name: "description",
        content: "The morning briefing: the digital marketing stories that matter today, in one short read.",
      },
      { property: "og:title", content: "Daily Digest — ViralSuperMart" },
      { property: "og:description", content: "Today's essential digital marketing briefing." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://viralsupermart.com/digest" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://viralsupermart.com/digest" }],
  }),
  loader: async () => {
    const [digest, cats] = await Promise.all([getDigest(), getCategories()]);
    return { ...digest, categories: cats.categories };
  },
  component: DigestPage,
});

function DigestPage() {
  const { digest, articles, categories } = Route.useLoaderData();
  const lang = useLang();
  return (
    <PageShell categories={categories}>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Morning Briefing</p>
        <h1 className="mt-1 font-display text-4xl font-black text-primary">
          {digest?.title ?? "Today in digital marketing"}
        </h1>
        {digest?.intro && <p className="mt-3 font-serif text-lg text-ink-soft">{digest.intro}</p>}
        <ol className="mt-8 space-y-6">
          {articles.map((a, i) => (
            <li key={a.id} className="flex gap-4 border-b border-rule pb-5">
              <span className="font-display text-3xl font-black text-rule">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <Link
                  to="/article/$slug"
                  params={{ slug: a.slug }}
                  className="font-display text-xl font-bold leading-snug text-ink hover:text-accent"
                >
                  {pickText(a, lang).title}
                </Link>
                {pickText(a, lang).summary && <p className="mt-1 font-serif text-sm text-ink-soft line-clamp-2">{pickText(a, lang).summary}</p>}
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {a.source_name} · <TimeAgo iso={a.published_at} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </PageShell>
  );
}
