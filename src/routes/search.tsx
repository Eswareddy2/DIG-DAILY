import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchArticles, getCategories, getRefreshStatus } from "@/lib/news.functions";
import { PageShell } from "@/components/news/SiteChrome";
import { ArticleCard } from "@/components/news/ArticleCard";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — ViralSuperMart" },
      { name: "description", content: "Search ViralSuperMart's archive of digital marketing news and updates." },
      { property: "og:title", content: "Search — ViralSuperMart" },
      { property: "og:description", content: "Find any digital marketing story we've collected." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://viralsupermart.com/search" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://viralsupermart.com/search" }],
  }),
  loader: async () => {
    const [cats, refresh] = await Promise.all([getCategories(), getRefreshStatus()]);
    return { ...cats, lastRunAt: refresh.lastRunAt };
  },
  component: SearchPage,
});

function SearchPage() {
  const { categories, lastRunAt } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const lang = useLang();
  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchArticles({ data: { q } }),
    enabled: q.trim().length > 1,
  });

  return (
    <PageShell categories={categories} lastRunAt={lastRunAt}>
       <h1 className="border-b border-rule pb-3 font-display text-3xl font-bold text-ink">{lang === "hi" ? "खोजें" : "Search"}</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
         placeholder={lang === "hi" ? "शीर्षक खोजें — जैसे Google अपडेट, AI विज्ञापन" : "Search headlines — e.g. core update, Performance Max, AI ads"}
        className="mt-5 w-full border border-input bg-card px-4 py-3 font-serif text-base outline-none focus:border-accent"
      />
      {isFetching && <p className="mt-4 text-sm text-muted-foreground">Searching…</p>}
      <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.articles ?? []).map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      {q.trim().length > 1 && !isFetching && (data?.articles.length ?? 0) === 0 && (
        <p className="py-16 text-center font-serif text-ink-soft">No stories matched “{q}”.</p>
      )}
    </PageShell>
  );
}
