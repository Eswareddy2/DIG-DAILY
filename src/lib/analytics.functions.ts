import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient(url: string, key: string): SupabaseClient {
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
}

/** Records one article read. Public — anyone reading a story can log a view. */
export const trackArticleView = createServerFn({ method: "POST" })
  .inputValidator((data: { articleId: string }) => ({ articleId: String(data?.articleId ?? "") }))
  .handler(async ({ data }) => {
    if (data.articleId.length < 10) return { ok: false };
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) return { ok: false };
    const supabase = publicClient(url, key);
    try {
      await supabase.from("page_views").insert({ article_id: data.articleId });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

/** Records a privacy-minimizing daily visitor and the public page they opened. */
export const trackSiteVisit = createServerFn({ method: "POST" })
  .inputValidator((data: { visitorId: string; path: string }) => ({
    visitorId: String(data?.visitorId ?? ""),
    path: String(data?.path ?? ""),
  }))
  .handler(async ({ data }) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.visitorId)) {
      return { ok: false };
    }
    const path = data.path.split(/[?#]/, 1)[0] ?? "";
    if (!path.startsWith("/") || path.length > 200) return { ok: false };

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) return { ok: false };
    const supabase = publicClient(url, key);
    try {
      const { error } = await supabase.from("site_visits").insert({
        visitor_id: data.visitorId,
        path,
      });
      return { ok: !error };
    } catch {
      return { ok: false };
    }
  });

/** Admin-only reader analytics: totals, 7-day trend, and most-read stories. */
export const getReaderAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    const { data: visitorData, error: visitorError } = await context.supabase.rpc("get_admin_site_analytics");
    if (visitorError) throw new Error(visitorError.message);
    const visitorStats = visitorData as {
      visitors24h?: number;
      visitors7d?: number;
      dailyVisitors?: { date: string; visitors: number }[];
    } | null;

    const supabase = context.supabase;
    const now = Date.now();
    const since24h = new Date(now - 24 * 3600 * 1000).toISOString();
    const since7d = new Date(now - 7 * 24 * 3600 * 1000).toISOString();

    const [total, last24h, recent] = await Promise.all([
      supabase.from("page_views").select("id", { count: "exact", head: true }),
      supabase.from("page_views").select("id", { count: "exact", head: true }).gte("viewed_at", since24h),
      supabase.from("page_views").select("article_id,viewed_at").gte("viewed_at", since7d).limit(8000),
    ]);

    const perArticle = new Map<string, number>();
    const perDay = new Map<string, number>();
    for (const row of (recent.data ?? []) as { article_id: string; viewed_at: string }[]) {
      perArticle.set(row.article_id, (perArticle.get(row.article_id) ?? 0) + 1);
      const day = row.viewed_at.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }

    const topIds = [...perArticle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    let top: { id: string; title: string; slug: string; views: number }[] = [];
    if (topIds.length > 0) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id,title,slug")
        .in("id", topIds.map(([id]) => id));
      const byId = new Map(((articles ?? []) as { id: string; title: string; slug: string }[]).map((a) => [a.id, a]));
      top = topIds.map(([id, views]) => ({
        id,
        views,
        title: byId.get(id)?.title ?? "Untitled",
        slug: byId.get(id)?.slug ?? "",
      }));
    }

    const daily: { date: string; views: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      daily.push({ date: day, views: perDay.get(day) ?? 0 });
    }

    return {
      visitors24h: visitorStats?.visitors24h ?? 0,
      visitors7d: visitorStats?.visitors7d ?? 0,
      dailyVisitors: visitorStats?.dailyVisitors ?? [],
      totalViews: total.count ?? 0,
      views24h: last24h.count ?? 0,
      views7d: recent.data?.length ?? 0,
      top,
      daily,
    };
  });
