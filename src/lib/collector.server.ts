import { XMLParser } from "fast-xml-parser";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decodeEntities } from "./format";
import { translateArticlesToHindi } from "./translate.server";

type FeedItem = {
  title: string;
  link: string;
  summary: string;
  content: string;
  image: string | null;
  publishedAt: string;
};

const MAX_SOURCES_PER_RUN = 35;
const MAX_ITEMS_PER_SOURCE = 10;
const LOCK_SECONDS = 90;

export const DEFAULT_PREMIUM_SOURCES = [
  { name: "Search Engine Land", site_url: "https://searchengineland.com", feed_url: "https://searchengineland.com/feed", default_category: "seo" },
  { name: "Search Engine Journal", site_url: "https://www.searchenginejournal.com", feed_url: "https://www.searchenginejournal.com/feed/", default_category: "seo" },
  { name: "Search Engine Roundtable", site_url: "https://www.seroundtable.com", feed_url: "https://www.seroundtable.com/index.rdf", default_category: "algorithm-updates" },
  { name: "Google Search Central", site_url: "https://developers.google.com/search", feed_url: "https://developers.google.com/search/blog/feed.xml", default_category: "algorithm-updates" },
  { name: "Google Ads & Commerce", site_url: "https://blog.google", feed_url: "https://blog.google/products/ads-commerce/rss/", default_category: "paid-ads" },
  { name: "Social Media Today", site_url: "https://www.socialmediatoday.com", feed_url: "https://www.socialmediatoday.com/feeds/news/", default_category: "social-media" },
  { name: "OpenAI News", site_url: "https://openai.com/news", feed_url: "https://openai.com/news/rss.xml", default_category: "ai-marketing" },
  { name: "Microsoft Advertising", site_url: "https://about.ads.microsoft.com", feed_url: "https://about.ads.microsoft.com/en-us/blog/rss", default_category: "paid-ads" },
  { name: "Meta Newsroom", site_url: "https://about.fb.com", feed_url: "https://about.fb.com/news/feed/", default_category: "social-media" },
  { name: "Ahrefs Blog", site_url: "https://ahrefs.com/blog", feed_url: "https://ahrefs.com/blog/feed/", default_category: "seo" },
  { name: "Semrush Blog", site_url: "https://www.semrush.com/blog", feed_url: "https://www.semrush.com/blog/feed/", default_category: "tools" },
  { name: "Marketing Dive", site_url: "https://www.marketingdive.com", feed_url: "https://www.marketingdive.com/feeds/news/", default_category: "ai-marketing" },
];

function adminClient(): SupabaseClient {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return text(record["#text"] ?? record["_"] ?? record["@_href"] ?? "");
  }
  return "";
}

function isTrackingPixel(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("1x1") ||
    lower.includes("pixel") ||
    lower.includes("feedburner") ||
    lower.includes("gravatar.com") ||
    lower.includes("wp-stat") ||
    lower.includes("beacon") ||
    lower.endsWith(".svg")
  );
}

function firstImageFromHtml(html: string): string | null {
  if (!html) return null;
  const matches = html.matchAll(/<img[^>]+(?:src|data-src|data-orig-file)=["']([^"']+)["']/gi);
  for (const match of matches) {
    const url = match[1];
    if (url && url.startsWith("http") && !isTrackingPixel(url)) {
      return url;
    }
  }
  return null;
}

function pickImage(entry: Record<string, unknown>, html: string): string | null {
  const mediaGroup = entry["media:group"] as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    entry["media:content"],
    entry["media:thumbnail"],
    mediaGroup?.["media:thumbnail"],
    mediaGroup?.["media:content"],
    entry["enclosure"],
    entry["image"],
  ];
  for (const candidate of candidates) {
    const arr = Array.isArray(candidate) ? candidate : [candidate];
    for (const node of arr) {
      if (!node) continue;
      if (typeof node === "string" && node.startsWith("http") && !isTrackingPixel(node)) return node;
      if (typeof node === "object") {
        const record = node as Record<string, unknown>;
        const url = text(record["@_url"] ?? record["@_href"] ?? record["url"]);
        if (url.startsWith("http") && !isTrackingPixel(url)) return url;
      }
    }
  }
  return firstImageFromHtml(html);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

function hashString(value: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < value.length; i += 1) {
    const c = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2246822519) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return `${parsed.host}${parsed.pathname}`.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function parseFeed(xml: string): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  const parsed = parser.parse(xml) as Record<string, any>;

  const rawEntries: Record<string, unknown>[] =
    parsed?.["rss"]?.channel?.item ??
    parsed?.["rdf:RDF"]?.item ??
    parsed?.["feed"]?.entry ??
    parsed?.["channel"]?.item ??
    [];

  const list = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  return list
    .filter(Boolean)
    .map((entry) => {
      const record = entry as Record<string, unknown>;
      const title = stripHtml(text(record["title"]));

      let link = text(record["link"]);
      if (!link || !link.startsWith("http")) {
        const linkNode = record["link"];
        const arr = Array.isArray(linkNode) ? linkNode : [linkNode];
        for (const node of arr) {
          if (node && typeof node === "object") {
            const href = text((node as Record<string, unknown>)["@_href"]);
            if (href.startsWith("http")) {
              link = href;
              break;
            }
          }
        }
      }
      if (!link.startsWith("http")) link = text(record["guid"]);

      const rawContent =
        text(record["content:encoded"]) ||
        text(record["content"]) ||
        text(record["description"]) ||
        text(record["summary"]);

      const published =
        text(record["pubDate"]) ||
        text(record["published"]) ||
        text(record["updated"]) ||
        text(record["dc:date"]);

      const publishedDate = published ? new Date(published) : new Date();
      const safeDate = Number.isNaN(publishedDate.getTime()) ? new Date() : publishedDate;

      const plain = stripHtml(rawContent);

      return {
        title,
        link,
        summary: plain.slice(0, 320),
        content: plain.slice(0, 4000),
        image: pickImage(record, rawContent),
        publishedAt: safeDate.toISOString(),
      };
    })
    .filter((item) => item.title.length > 8 && item.link.startsWith("http"));
}

export function categorize(
  item: { title: string; summary: string },
  categories: { slug: string; keywords: string[] }[],
  fallback: string,
): string {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  let best = { slug: fallback, score: 0 };
  for (const category of categories) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (keyword && haystack.includes(keyword.toLowerCase())) score += keyword.includes(" ") ? 3 : 1;
    }
    if (score > best.score) best = { slug: category.slug, score };
  }
  return best.slug;
}

export type CollectResult = {
  ran: boolean;
  reason?: string | undefined;
  logId?: string | undefined;
  sourcesChecked: number;
  itemsFound: number;
  itemsAdded: number;
  errorCount: number;
};

export async function runCollection(trigger: "cron" | "manual"): Promise<CollectResult> {
  const supabase = adminClient();
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + LOCK_SECONDS * 1000).toISOString();

  const { data: state } = await supabase.from("collector_state").select("paused").eq("id", "collector").maybeSingle();
  if (state?.paused && trigger === "cron") {
    return { ran: false, reason: "paused", sourcesChecked: 0, itemsFound: 0, itemsAdded: 0, errorCount: 0 };
  }

  const { data: lock } = await supabase
    .from("collector_state")
    .update({ locked_until: lockedUntil })
    .eq("id", "collector")
    .or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`)
    .select("id");

  if (!lock || lock.length === 0) {
    return { ran: false, reason: "already-running", sourcesChecked: 0, itemsFound: 0, itemsAdded: 0, errorCount: 0 };
  }

  const { data: log } = await supabase
    .from("collection_logs")
    .insert({ trigger, status: "running" })
    .select("id")
    .single();

  const logId = log?.id as string | undefined;

  let itemsFound = 0;
  let itemsAdded = 0;
  let errorCount = 0;
  const messages: string[] = [];
  const toTranslate: { id: string; title: string; summary: string | null; content: string | null }[] = [];

  try {
    const [{ data: sources }, { data: categories }] = await Promise.all([
      supabase
        .from("sources")
        .select("id,name,feed_url,default_category,site_url")
        .eq("enabled", true)
        .order("last_fetched_at", { ascending: true, nullsFirst: true })
        .limit(MAX_SOURCES_PER_RUN),
      supabase.from("categories").select("slug,keywords"),
    ]);

    const categoryList = (categories ?? []) as { slug: string; keywords: string[] }[];
    const sourceList = sources ?? [];

    for (const source of sourceList) {
      try {
        const response = await fetch(source.feed_url, {
          headers: {
            "user-agent": "ViralSuperMartBot/1.0 (+news aggregator)",
            accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const xml = await response.text();
        const items = parseFeed(xml).slice(0, MAX_ITEMS_PER_SOURCE);
        itemsFound += items.length;

        for (const item of items) {
          const dedupeHash = hashString(normalizeUrl(item.link) || item.title.toLowerCase());
          const categorySlug = categorize(item, categoryList, source.default_category ?? "tools");
          const slug = `${slugify(item.title) || "story"}-${dedupeHash.slice(0, 6)}`;

          const { data: inserted, error } = await supabase
            .from("articles")
            .insert({
              slug,
              title: item.title,
              summary: item.summary,
              content: item.content,
              image_url: item.image,
              source_id: source.id,
              source_name: source.name,
              original_url: item.link,
              category_slug: categorySlug,
              published_at: item.publishedAt,
              status: "approved",
              auto_collected: true,
              dedupe_hash: dedupeHash,
            })
            .select("id")
            .maybeSingle();

          if (!error) {
            itemsAdded += 1;
            if (inserted?.id) {
              toTranslate.push({ id: inserted.id as string, title: item.title, summary: item.summary, content: item.content });
            }
          } else if (error.code !== "23505") {
            errorCount += 1;
            messages.push(`${source.name}: ${error.message}`);
          }
        }

        await supabase
          .from("sources")
          .update({ last_fetched_at: new Date().toISOString(), last_status: "ok", last_error: null })
          .eq("id", source.id);
      } catch (error) {
        errorCount += 1;
        const message = error instanceof Error ? error.message : String(error);
        messages.push(`${source.name}: ${message}`);
        await supabase
          .from("sources")
          .update({ last_fetched_at: new Date().toISOString(), last_status: "error", last_error: message })
          .eq("id", source.id);
      }
    }

    if (toTranslate.length > 0) {
      try {
        const translated = await translateArticlesToHindi(supabase, toTranslate.slice(0, 30));
        if (translated > 0) messages.push(`hindi: ${translated} translated`);
      } catch (error) {
        messages.push(`hindi translation skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (logId) {
      await supabase
        .from("collection_logs")
        .update({
          finished_at: new Date().toISOString(),
          sources_checked: sourceList.length,
          items_found: itemsFound,
          items_added: itemsAdded,
          error_count: errorCount,
          status: errorCount > 0 ? "completed_with_errors" : "completed",
          message: messages.slice(0, 6).join(" | ") || null,
        })
        .eq("id", logId);
    }

    await supabase
      .from("collector_state")
      .update({ locked_until: null, last_run_at: new Date().toISOString() })
      .eq("id", "collector");

    return {
      ran: true,
      logId,
      sourcesChecked: sourceList.length,
      itemsFound,
      itemsAdded,
      errorCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (logId) {
      await supabase
        .from("collection_logs")
        .update({ finished_at: new Date().toISOString(), status: "failed", message, error_count: errorCount + 1 })
        .eq("id", logId);
    }
    await supabase.from("collector_state").update({ locked_until: null }).eq("id", "collector");
    throw error;
  }
}
