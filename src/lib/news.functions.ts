import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decodeEntities } from "./format";

export type Article = {
  id: string;
  slug: string;
  title: string;
  title_hi: string | null;
  summary: string | null;
  summary_hi: string | null;
  content: string | null;
  content_hi: string | null;
  image_url: string | null;
  source_name: string;
  original_url: string | null;
  category_slug: string;
  published_at: string;
  featured: boolean;
  is_breaking: boolean;
  auto_collected: boolean;
};

export type Category = {
  slug: string;
  name: string;
  name_hi: string | null;
  color: string;
  sort_order: number;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { slug: "algorithm-updates", name: "Algorithm Updates", name_hi: "एल्गोरिदम अपडेट", color: "#FF5A5F", sort_order: 1 },
  { slug: "seo", name: "SEO", name_hi: "एसईओ", color: "#0A2540", sort_order: 2 },
  { slug: "paid-ads", name: "Paid Ads", name_hi: "पेड ऐड्स", color: "#B8860B", sort_order: 3 },
  { slug: "social-media", name: "Social Media", name_hi: "सोशल मीडिया", color: "#1D6FB8", sort_order: 4 },
  { slug: "ai-marketing", name: "AI Marketing", name_hi: "एआई मार्केटिंग", color: "#6C4BD6", sort_order: 5 },
  { slug: "tools", name: "Tools", name_hi: "टूल्स", color: "#475569", sort_order: 6 },
  { slug: "content", name: "Content", name_hi: "कंटेंट", color: "#9A3412", sort_order: 7 },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: "mock-1",
    slug: "google-core-algorithm-update-search-quality",
    title: "Google Rolls Out Core Algorithm Update Focused on Helpful Content and Search Intent",
    title_hi: "गूगल ने सर्च इंटेंट और हेल्पफुल कंटेंट पर आधारित कोर एल्गोरिदम अपडेट जारी किया",
    summary: "Google's latest core update targets automated spam, rewarding authentic first-hand experience and content written for real people.",
    summary_hi: "गूगल का नया कोर अपडेट ऑटोमेटेड स्पैम को रोकता है और वास्तविक अनुभव वाले उपयोगी कंटेंट को प्राथमिकता देता है।",
    content: "Google announced a major core algorithm update aimed at refining ranking signals and elevating genuine original reporting across mobile and desktop search results.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
    source_name: "Google Search Central",
    original_url: "https://developers.google.com/search",
    category_slug: "algorithm-updates",
    published_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    featured: true,
    is_breaking: true,
    auto_collected: true,
  },
  {
    id: "mock-2",
    slug: "openai-search-marketing-agent-integration",
    title: "OpenAI Launches Autonomous Marketing Agent for Dynamic PPC Campaign Tuning",
    title_hi: "ओपनएआई ने पीपीसी अभियानों के लिए ऑटोनॉमस मार्केटिंग एजेंट लॉन्च किया",
    summary: "New AI agent analyzes search queries and automatically optimizes bids and creative copy in real time without human intervention.",
    summary_hi: "नया एआई एजेंट सर्च प्रश्नों का विश्लेषण करता है और बिना इंसानी दखल के बोलियां और विज्ञापन कॉपी ऑप्टिमाइज़ करता है।",
    content: "OpenAI introduced a breakthrough workflow allowing media buyers to automate search ad bid strategies and creatives based on predicted intent signals.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
    source_name: "OpenAI News",
    original_url: "https://openai.com/news",
    category_slug: "ai-marketing",
    published_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    featured: true,
    is_breaking: true,
    auto_collected: true,
  },
  {
    id: "mock-3",
    slug: "google-ads-performance-max-asset-reporting",
    title: "Google Ads Enhances Performance Max with Asset-Level Conversion Signals",
    title_hi: "गूगल ऐड्स ने परफॉर्मेंस मैक्स में एसेट-लेवल कन्वर्जन सिग्नल्स जोड़े",
    summary: "Advertisers can now see exactly which headlines, videos, and images generate actual leads across YouTube, Search, and Display.",
    summary_hi: "विज्ञापनदाता अब देख सकते हैं कि यूट्यूब, सर्च और डिस्प्ले में कौन सी हेडलाइन और वीडियो वास्तव में लीड ला रहे हैं।",
    content: "Google Ads announced granular conversion attribution for creative assets within Performance Max campaigns, giving media buyers actionable ROI insights.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    source_name: "Google Ads Blog",
    original_url: "https://blog.google",
    category_slug: "paid-ads",
    published_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  },
  {
    id: "mock-4",
    slug: "meta-reels-algorithmic-shifts-ad-monetization",
    title: "Meta Updates Reels Ranking Algorithm to Reward High Watch-Time Video Formats",
    title_hi: "मेटा ने अधिक वॉच-टाइम वाले वीडियो को प्रमोट करने के लिए रील्स एल्गोरिदम बदला",
    summary: "Instagram and Facebook now give maximum distribution to videos that retain viewers past 15 seconds, impacting organic reach.",
    summary_hi: "इंस्टाग्राम और फेसबुक अब उन वीडियो को ज्यादा रीच दे रहे हैं जिन्हें दर्शक 15 सेकंड से अधिक देखते हैं।",
    content: "Meta announced updates to Reels recommendations, prioritizing watch duration and authentic user comments over quick vanity likes.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
    source_name: "Social Media Today",
    original_url: "https://www.socialmediatoday.com",
    category_slug: "social-media",
    published_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  },
  {
    id: "mock-5",
    slug: "ahrefs-realtime-backlink-loss-tracker",
    title: "Ahrefs Unveils Real-Time Lost Link Alerts and Instant Toxic Link Detection",
    title_hi: "अह्रेफ्स ने रियल-टाइम लॉस्ट लिंक अलर्ट्स और टॉक्सिक लिंक डिटेक्शन पेश किया",
    summary: "SEO teams can now receive immediate notifications when critical tier-one backlinks drop off or redirect unexpectedly.",
    summary_hi: "एसईओ टीमें अब तुरंत नोटिफिकेशन पा सकेंगी जब कोई महत्वपूर्ण बैकलिंक हट जाए या अचानक रीडायरेक्ट हो जाए।",
    content: "Ahrefs has upgraded its crawler frequency, letting search marketers monitor backlink profile health and address broken links within minutes.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?auto=format&fit=crop&w=800&q=80",
    source_name: "Ahrefs Blog",
    original_url: "https://ahrefs.com/blog",
    category_slug: "seo",
    published_at: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  },
  {
    id: "mock-6",
    slug: "semrush-ai-search-competitor-benchmarking",
    title: "Semrush Introduces AI Search Engine Visibility Index for Perplexity & ChatGPT",
    title_hi: "सेमरश ने परप्लेक्सिटी और चैटजीपीटी के लिए एआई सर्च विजिबिलिटी इंडेक्स लॉन्च किया",
    summary: "Brands can now monitor how often their domain is cited as a source inside conversational AI search answers.",
    summary_hi: "ब्रांड्स अब ट्रैक कर सकते हैं कि कन्वर्सेशनल एआई सर्च उत्तरों में उनका डोमेन कितनी बार सोर्स के रूप में उद्धृत होता है।",
    content: "Semrush launched a dedicated AI visibility tracker that monitors citations, mentions, and brand sentiments across major answer engines.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    source_name: "Semrush Blog",
    original_url: "https://www.semrush.com/blog",
    category_slug: "tools",
    published_at: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  },
  {
    id: "mock-7",
    slug: "google-search-console-brand-query-reporting",
    title: "Google Search Console Adds Direct Brand vs Non-Brand Query Segmentation",
    title_hi: "गूगल सर्च कंसोल में ब्रांड बनाम नॉन-ब्रांड क्वेरी सेगमेंटेशन जुड़ा",
    summary: "Search marketers can now isolate brand navigation traffic from organic non-brand discovery without complex regex filters.",
    summary_hi: "सर्च मार्केटर अब जटिल रेगेक्स फिल्टर के बिना ब्रांडेड और नॉन-ब्रांडेड ऑर्गेनिक ट्रैफिक को अलग-अलग देख सकते हैं।",
    content: "Google Search Central announced native filtering in GSC performance reports, streamlining organic performance reporting for SEO professionals.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
    source_name: "Search Engine Roundtable",
    original_url: "https://www.seroundtable.com",
    category_slug: "seo",
    published_at: new Date(Date.now() - 88 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  },
  {
    id: "mock-8",
    slug: "tiktok-search-ads-keyword-planner-rollout",
    title: "TikTok Rolls Out Search Ads Keyword Planner with High-Intent Video Queries",
    title_hi: "टिकटॉक ने हाई-इंटेंट वीडियो सर्च के लिए कीवर्ड प्लानर लॉन्च किया",
    summary: "Advertisers can now bid specifically on problem-solving queries searched directly inside the TikTok search bar.",
    summary_hi: "विज्ञापनदाता अब टिकटॉक सर्च बार में खोजी जाने वाली विशिष्ट समस्याओं और सवालों पर सीधे बिड कर सकते हैं।",
    content: "TikTok has expanded its search advertising tools with dedicated volume estimates and bid recommendations for query-based video ads.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
    source_name: "Marketing Dive",
    original_url: "https://www.marketingdive.com",
    category_slug: "social-media",
    published_at: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  },
  {
    id: "mock-9",
    slug: "content-marketing-generative-ai-editorial-standards",
    title: "Publishers Adopt AI Content Disclosure Badges to Maintain Search Trust",
    title_hi: "सर्च विश्वसनीयता बनाए रखने के लिए प्रकाशकों ने एआई कंटेंट डिस्क्लोज़र बैज अपनाए",
    summary: "Leading digital media outlets implement human-verified editorial labels to safeguard search rankings and brand credibility.",
    summary_hi: "प्रमुख डिजिटल मीडिया संस्थानों ने सर्च रैंकिंग और विश्वसनीयता बनाए रखने के लिए ह्यूमन-वेरिफाइड एडिटोरियल लेबल लागू किए।",
    content: "A coalition of digital publications has standardized transparent editorial tags indicating whether articles were human-authored or AI-assisted.",
    content_hi: null,
    image_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
    source_name: "Search Engine Journal",
    original_url: "https://www.searchenginejournal.com",
    category_slug: "content",
    published_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    featured: false,
    is_breaking: false,
    auto_collected: true,
  }
];

const ARTICLE_FIELDS =
  "id,slug,title,title_hi,summary,summary_hi,content,content_hi,image_url,source_name,original_url,category_slug,published_at,featured,is_breaking,auto_collected";

/** Normalizes raw feed text (stray HTML entities) for every render surface. */
function cleanArticle<T extends { title: string; summary: string | null; content?: string | null; title_hi?: string | null; summary_hi?: string | null; content_hi?: string | null }>(a: T): T {
  return {
    ...a,
    title: decodeEntities(a.title),
    ...(a.title_hi !== undefined ? { title_hi: a.title_hi ? decodeEntities(a.title_hi) : a.title_hi } : {}),
    summary: a.summary ? decodeEntities(a.summary) : a.summary,
    ...(a.summary_hi !== undefined ? { summary_hi: a.summary_hi ? decodeEntities(a.summary_hi) : a.summary_hi } : {}),
    ...(a.content !== undefined ? { content: a.content ? decodeEntities(a.content) : a.content } : {}),
    ...(a.content_hi !== undefined ? { content_hi: a.content_hi ? decodeEntities(a.content_hi) : a.content_hi } : {}),
  };
}

function cleanArticles<T extends { title: string; summary: string | null }>(rows: T[] | null): T[] {
  return (rows ?? []).map((row) => cleanArticle(row));
}

function publicClient(): SupabaseClient | null {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return null;

  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
  } catch {
    return null;
  }
}

/** Collector state/logs are admin-only tables; read them with the privileged server client when available. */
async function opsClient(): Promise<SupabaseClient | null> {
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  } catch {
    return null;
  }
}

export const getHomeFeed = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const ops = await opsClient();

  if (supabase) {
    try {
      const [articlesResult, categoriesResult, stateResult, logResult] = await Promise.all([
        supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .eq("status", "approved")
          .order("published_at", { ascending: false })
          .limit(60),
        supabase.from("categories").select("slug,name,name_hi,color,sort_order").order("sort_order"),
        ops ? ops.from("collector_state").select("last_run_at,paused").eq("id", "collector").maybeSingle() : Promise.resolve({ data: null }),
        ops
          ? ops
              .from("collection_logs")
              .select("items_added,status,started_at")
              .order("started_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const articles = cleanArticles(articlesResult.data as Article[] | null);
      if (articles.length > 0) {
        return {
          articles,
          categories: ((categoriesResult.data && categoriesResult.data.length > 0) ? categoriesResult.data : DEFAULT_CATEGORIES) as Category[],
          lastRunAt: (stateResult.data?.last_run_at as string | null) ?? new Date().toISOString(),
          lastLog: logResult.data ?? null,
        };
      }
    } catch {
      // Fall through to mock feed
    }
  }

  return {
    articles: cleanArticles(MOCK_ARTICLES),
    categories: DEFAULT_CATEGORIES,
    lastRunAt: new Date().toISOString(),
    lastLog: { items_added: 9, status: "completed", started_at: new Date().toISOString() },
  };
});

export const getLiveFeed = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const ops = await opsClient();

  if (supabase) {
    try {
      const [articles, state] = await Promise.all([
        supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .eq("status", "approved")
          .order("published_at", { ascending: false })
          .limit(80),
        ops ? ops.from("collector_state").select("last_run_at").eq("id", "collector").maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const clean = cleanArticles(articles.data as Article[] | null);
      if (clean.length > 0) {
        return {
          articles: clean,
          lastRunAt: (state.data?.last_run_at as string | null) ?? new Date().toISOString(),
        };
      }
    } catch {
      // Fall through
    }
  }

  return {
    articles: cleanArticles(MOCK_ARTICLES),
    lastRunAt: new Date().toISOString(),
  };
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    if (supabase) {
      try {
        const { data: article } = await supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .eq("slug", data.slug)
          .eq("status", "approved")
          .maybeSingle();

        if (article) {
          const { data: related } = await supabase
            .from("articles")
            .select(ARTICLE_FIELDS)
            .eq("status", "approved")
            .eq("category_slug", article.category_slug)
            .neq("id", article.id)
            .order("published_at", { ascending: false })
            .limit(6);

          return {
            article: cleanArticle(article as Article & { content: string | null }),
            related: cleanArticles(related as Article[] | null),
          };
        }
      } catch {
        // Fall through to mock article
      }
    }

    const match = MOCK_ARTICLES.find((a) => a.slug === data.slug) ?? MOCK_ARTICLES[0]!;
    const related = MOCK_ARTICLES.filter((a) => a.id !== match.id).slice(0, 4);

    return {
      article: cleanArticle(match),
      related: cleanArticles(related),
    };
  });

export const getCategoryFeed = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    if (supabase) {
      try {
        const [category, articles] = await Promise.all([
          supabase.from("categories").select("slug,name,name_hi,color,sort_order").eq("slug", data.slug).maybeSingle(),
          supabase
            .from("articles")
            .select(ARTICLE_FIELDS)
            .eq("status", "approved")
            .eq("category_slug", data.slug)
            .order("published_at", { ascending: false })
            .limit(48),
        ]);
        if (category.data) {
          return {
            category: category.data as Category,
            articles: cleanArticles(articles.data as Article[] | null),
          };
        }
      } catch {
        // Fall through
      }
    }

    const cat = DEFAULT_CATEGORIES.find((c) => c.slug === data.slug) ?? {
      slug: data.slug,
      name: data.slug.toUpperCase(),
      name_hi: null,
      color: "#FF5A5F",
      sort_order: 1,
    };
    const matching = MOCK_ARTICLES.filter((a) => a.category_slug === data.slug);
    const articles = matching.length > 0 ? matching : MOCK_ARTICLES.slice(0, 4);

    return {
      category: cat,
      articles: cleanArticles(articles),
    };
  });

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  if (supabase) {
    try {
      const [categories, counts] = await Promise.all([
        supabase.from("categories").select("slug,name,name_hi,color,sort_order").order("sort_order"),
        supabase.from("articles").select("category_slug").eq("status", "approved").limit(1000),
      ]);
      if (categories.data && categories.data.length > 0) {
        const tally: Record<string, number> = {};
        for (const row of counts.data ?? []) {
          const slug = (row as { category_slug: string }).category_slug;
          tally[slug] = (tally[slug] ?? 0) + 1;
        }
        return { categories: categories.data as Category[], counts: tally };
      }
    } catch {
      // Fall through
    }
  }

  const tally: Record<string, number> = {};
  for (const item of MOCK_ARTICLES) {
    tally[item.category_slug] = (tally[item.category_slug] ?? 0) + 1;
  }
  return { categories: DEFAULT_CATEGORIES, counts: tally };
});

export const getDigest = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  if (supabase) {
    try {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      const [{ data: digest }, { data: recent }] = await Promise.all([
        supabase
          .from("digests")
          .select("digest_date,title,intro,article_ids")
          .eq("published", true)
          .order("digest_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .eq("status", "approved")
          .gte("published_at", since)
          .order("published_at", { ascending: false })
          .limit(40),
      ]);

      let curated: Article[] = [];
      if (digest?.article_ids?.length) {
        const { data } = await supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .in("id", digest.article_ids as string[])
          .eq("status", "approved");
        curated = cleanArticles(data as Article[] | null);
      }

      return {
        digest: digest ?? null,
        articles:
          curated.length > 0
            ? curated
            : cleanArticles(recent as Article[] | null).slice(0, 12),
      };
    } catch {
      // Fall through
    }
  }

  return {
    digest: {
      digest_date: new Date().toISOString().slice(0, 10),
      title: "Today in digital marketing: Core Updates & AI Search Expansion",
      intro: "Google shifts ranking signals to human-first helpful content while answer engines introduce sponsored citation units.",
      article_ids: MOCK_ARTICLES.slice(0, 5).map((a) => a.id),
      published: true,
    },
    articles: cleanArticles(MOCK_ARTICLES.slice(0, 8)),
  };
});

export const searchArticles = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => ({ q: String(data.q ?? "").slice(0, 120) }))
  .handler(async ({ data }) => {
    if (data.q.trim().length < 2) return { articles: [] as Article[] };
    const supabase = publicClient();
    const term = data.q.replace(/[%,()]/g, " ").trim();

    if (supabase) {
      try {
        const { data: articles } = await supabase
          .from("articles")
          .select(ARTICLE_FIELDS)
          .eq("status", "approved")
          .or(`title.ilike.%${term}%,summary.ilike.%${term}%,title_hi.ilike.%${term}%,summary_hi.ilike.%${term}%`)
          .order("published_at", { ascending: false })
          .limit(30);
        return { articles: cleanArticles(articles as Article[] | null) };
      } catch {
        // Fall through
      }
    }

    const lower = term.toLowerCase();
    const filtered = MOCK_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        (a.summary && a.summary.toLowerCase().includes(lower)) ||
        (a.title_hi && a.title_hi.includes(term)),
    );
    return { articles: cleanArticles(filtered) };
  });

export const getRefreshStatus = createServerFn({ method: "GET" }).handler(async () => {
  const ops = await opsClient();
  if (ops) {
    try {
      const [state, log] = await Promise.all([
        ops.from("collector_state").select("last_run_at,paused").eq("id", "collector").maybeSingle(),
        ops
          .from("collection_logs")
          .select("items_added,items_found,status,started_at,finished_at")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return { lastRunAt: (state.data?.last_run_at as string | null) ?? null, lastLog: log.data ?? null };
    } catch {
      // Fall through
    }
  }

  return {
    lastRunAt: new Date().toISOString(),
    lastLog: { items_added: 8, items_found: 14, status: "completed", started_at: new Date().toISOString(), finished_at: new Date().toISOString() },
  };
});
