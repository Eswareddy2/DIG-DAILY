import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCategoryFeed, getCategories } from "@/lib/news.functions";
import { PageShell } from "@/components/news/SiteChrome";
import { ArticleCard } from "@/components/news/ArticleCard";
import { pickText, useLang } from "@/lib/lang";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const [feed, cats] = await Promise.all([
      getCategoryFeed({ data: { slug: params.slug } }),
      getCategories(),
    ]);
    if (!feed.category) throw notFound();
    return { ...feed, categories: cats.categories };
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.category?.name ?? "Category";
    const url = `https://viralsupermart.com/category/${params.slug}`;
    const desc = `Latest ${name} news for digital marketers, collected from official sources and updated every 2 minutes.`;
    return {
      meta: [
        { title: `${name} News — ViralSuperMart` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} News — ViralSuperMart` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const loaderData = Route.useLoaderData();
  const slug = loaderData.category!.slug;
  const lang = useLang();

  const { data } = useQuery({
    queryKey: ["category-feed", slug],
    queryFn: () => getCategoryFeed({ data: { slug } }),
    initialData: { category: loaderData.category, articles: loaderData.articles },
    refetchInterval: 120_000,
    refetchIntervalInBackground: true,
  });

  const { category, articles } = data;

  return (
    <PageShell categories={loaderData.categories}>
      <h1 className="border-b border-rule pb-3 font-display text-3xl font-bold text-ink">
        {lang === "hi" && category?.name_hi ? category.name_hi : category?.name}
      </h1>
      {articles.length === 0 ? (
        <p className="py-20 text-center font-serif text-ink-soft">No stories in this section yet.</p>
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
