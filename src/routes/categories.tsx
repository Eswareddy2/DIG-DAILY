import { createFileRoute, Link } from "@tanstack/react-router";
import { getCategories, getRefreshStatus } from "@/lib/news.functions";
import { PageShell } from "@/components/news/SiteChrome";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Topics — ViralSuperMart" },
      {
        name: "description",
        content: "Browse every ViralSuperMart section: SEO, paid ads, social media, AI marketing, tools and algorithm updates.",
      },
      { property: "og:title", content: "All Topics — ViralSuperMart" },
      { property: "og:description", content: "Every digital marketing news section in one place." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://viralsupermart.com/categories" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://viralsupermart.com/categories" }],
  }),
  loader: async () => {
    const [cats, refresh] = await Promise.all([getCategories(), getRefreshStatus()]);
    return { ...cats, lastRunAt: refresh.lastRunAt };
  },
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories, counts, lastRunAt } = Route.useLoaderData();
  return (
    <PageShell categories={categories} lastRunAt={lastRunAt}>
      <h1 className="border-b border-rule pb-3 font-display text-3xl font-bold text-ink">
        Topics
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className="border border-rule bg-card p-5 transition-colors hover:border-accent"
          >
            <h2 className="font-display text-xl font-bold text-ink">{c.name}</h2>
            {c.name_hi && <p className="font-hindi text-sm text-ink-soft">{c.name_hi}</p>}
            <p className="mt-2 text-xs uppercase tracking-widest text-accent">
              {counts[c.slug] ?? 0} stories
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
