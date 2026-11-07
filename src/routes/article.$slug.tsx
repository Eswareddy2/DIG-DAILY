import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { getArticle, getCategories } from "@/lib/news.functions";
import { trackArticleView } from "@/lib/analytics.functions";
import { PageShell } from "@/components/news/SiteChrome";
import { ArticleCard } from "@/components/news/ArticleCard";
import { fullDate } from "@/lib/format";
import { pickText, useLang } from "@/lib/lang";

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ params }) => {
    const [result, cats] = await Promise.all([
      getArticle({ data: { slug: params.slug } }),
      getCategories(),
    ]);
    if (!result.article) throw notFound();
    return { ...result, categories: cats.categories };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Story unavailable — ViralSuperMart" }, { name: "robots", content: "noindex" }] };
    }
    const a = loaderData.article!;
    const desc = (a.summary ?? a.title).slice(0, 155);
    const url = `https://viralsupermart.com/article/${params.slug}`;
    const meta = [
      { title: `${a.title.slice(0, 65)} — ViralSuperMart` },
      { name: "description", content: desc },
      { property: "og:title", content: a.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (a.image_url?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: a.image_url },
        { name: "twitter:image", content: a.image_url },
      );
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { article, related, categories } = Route.useLoaderData();
  const a = article!;
  const lang = useLang();
  const { title, summary, content } = pickText(a, lang);

  useEffect(() => {
    void trackArticleView({ data: { articleId: a.id } });
  }, [a.id]);

  return (
    <PageShell categories={categories}>
      <article className="mx-auto max-w-3xl">
        <Link
          to="/category/$slug"
          params={{ slug: a.category_slug }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-accent"
        >
          {a.category_slug.replace(/-/g, " ")}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-black leading-tight text-ink md:text-5xl">
          {title}
        </h1>
        {summary && <p className="mt-4 font-serif text-lg text-ink-soft">{summary}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-rule py-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="font-semibold text-ink">{a.source_name}</span>
          <span>·</span>
          <time>{fullDate(a.published_at)}</time>
          {a.auto_collected && (
            <span className="ml-auto border border-accent px-2 py-0.5 font-semibold text-accent">
              Auto-collected
            </span>
          )}
        </div>
        {a.image_url && (
          <img src={a.image_url} alt={title} className="mt-5 w-full object-cover" loading="lazy" />
        )}
        {content && (
          <div className="mt-6 space-y-4 font-serif text-[17px] leading-relaxed text-ink">
            {content.split(/\n{1,}/).filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {a.original_url && (
          <a
            href={a.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent"
          >
            {lang === "hi" ? `${a.source_name} पर पूरी खबर पढ़ें →` : `Read the full story at ${a.source_name} →`}
          </a>
        )}
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-12 max-w-5xl">
          <h2 className="border-b border-rule pb-2 font-display text-xl font-bold text-ink">
            Related coverage
          </h2>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
