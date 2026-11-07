import { Link } from "@tanstack/react-router";
import type { Article } from "@/lib/news.functions";
import { TimeAgo } from "@/components/news/TimeAgo";
import { pickText, useLang } from "@/lib/lang";

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  seo: "https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?auto=format&fit=crop&w=600&q=80",
  "paid-ads": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  "social-media": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80",
  "ai-marketing": "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80",
  "algorithm-updates": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80",
  tools: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  content: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80",
};

export function getArticleImage(article: { image_url?: string | null; category_slug?: string }): string {
  if (article.image_url && article.image_url.startsWith("http")) {
    return article.image_url;
  }
  return (
    CATEGORY_FALLBACK_IMAGES[article.category_slug ?? ""] ??
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
  );
}

export function CategoryTag({ slug }: { slug: string }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
      {slug.replace(/-/g, " ")}
    </span>
  );
}

/** Truncate to ~120 chars for a short attention-grabbing summary line. */
function shortSummary(text: string | null, maxLen = 120): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function ArticleCard({
  article,
  size = "md",
  layout = "stack",
}: {
  article: Article;
  size?: "sm" | "md" | "lg";
  layout?: "stack" | "horizontal";
}) {
  const lang = useLang();
  const { title, summary } = pickText(article, lang);
  const isLg = size === "lg";
  const imageUrl = getArticleImage(article);
  const brief = isLg ? shortSummary(summary, 180) : shortSummary(summary, 120);

  if (layout === "horizontal") {
    return (
      <article className="group flex items-start justify-between gap-4 border-b border-rule pb-4">
        <div className="flex-1 min-w-0 space-y-1">
          <CategoryTag slug={article.category_slug} />
          <Link to="/article/$slug" params={{ slug: article.slug }}>
            <h3 className="font-display font-bold text-sm sm:text-base leading-snug text-ink transition-colors group-hover:text-accent line-clamp-2">
              {title}
            </h3>
          </Link>
          {brief && (
            <p className="text-[12px] leading-relaxed text-ink-soft line-clamp-2">
              {brief}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground pt-0.5">
            <span className="font-semibold text-ink-soft truncate max-w-[120px]">{article.source_name}</span>
            <span>·</span>
            <TimeAgo iso={article.published_at} />
          </div>
        </div>
        <Link to="/article/$slug" params={{ slug: article.slug }} className="shrink-0 overflow-hidden bg-muted/40">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-24 h-18 sm:w-28 sm:h-20 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex flex-col gap-2 pb-6">
      <Link to="/article/$slug" params={{ slug: article.slug }} className="overflow-hidden bg-muted/40">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.01] ${
            isLg ? "aspect-[16/9]" : "aspect-[3/2] max-h-44"
          }`}
        />
      </Link>
      <CategoryTag slug={article.category_slug} />
      <Link to="/article/$slug" params={{ slug: article.slug }}>
        <h3
          className={`font-display font-bold leading-snug text-ink transition-colors group-hover:text-accent ${
            isLg ? "text-2xl md:text-3xl" : size === "sm" ? "text-sm" : "text-base"
          }`}
        >
          {title}
        </h3>
      </Link>
      {brief && (
        <p className={`text-ink-soft leading-relaxed ${isLg ? "text-sm" : "text-[12px]"} line-clamp-2`}>
          {brief}
        </p>
      )}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="font-semibold text-ink-soft">{article.source_name}</span>
        <span>·</span>
        <TimeAgo iso={article.published_at} />
      </div>
    </article>
  );
}
