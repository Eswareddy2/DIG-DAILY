import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

/** Only the email stored in VIRALSUPERMART_ADMIN_EMAIL or DIGIDAILY_ADMIN_EMAIL secret may become the (single) admin. */
function isOwnerEmail(claims: unknown): boolean {
  const owner = (process.env["VIRALSUPERMART_ADMIN_EMAIL"] ?? process.env["DIGIDAILY_ADMIN_EMAIL"] ?? "").trim().toLowerCase();
  if (!owner) return false;
  const claimant = (claims as { email?: unknown } | null | undefined)?.email;
  return typeof claimant === "string" && claimant.trim().toLowerCase() === owner;
}

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error(countError.message);

    const owner = (process.env["VIRALSUPERMART_ADMIN_EMAIL"] ?? process.env["DIGIDAILY_ADMIN_EMAIL"] ?? "").trim().toLowerCase();
    const canClaim = !data && ((count ?? 0) === 0) && (!owner || isOwnerEmail(context.claims));

    return {
      isAdmin: Boolean(data),
      canClaimAdmin: canClaim,
      userId: context.userId,
      email: (context.claims as { email?: string })?.email,
    };
  });

/** Bootstrap: only the allowlisted owner email or first user when unassigned can claim the admin role. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const owner = (process.env["VIRALSUPERMART_ADMIN_EMAIL"] ?? process.env["DIGIDAILY_ADMIN_EMAIL"] ?? "").trim().toLowerCase();
    if (owner && !isOwnerEmail(context.claims)) {
      return { granted: false, reason: "Administrator setup is restricted to the site owner's account." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) return { granted: false, reason: "An admin already exists. Access denied." };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { granted: true };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabase = context.supabase;

    const [total, pending, breaking, state, logs, sources] = await Promise.all([
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("articles").select("id", { count: "exact", head: true }).eq("is_breaking", true),
      supabase.from("collector_state").select("last_run_at,paused,locked_until").eq("id", "collector").maybeSingle(),
      supabase.from("collection_logs").select("*").order("started_at", { ascending: false }).limit(15),
      supabase.from("sources").select("*").order("name"),
    ]);

    return {
      totals: {
        articles: total.count ?? 0,
        pending: pending.count ?? 0,
        breaking: breaking.count ?? 0,
        sources: sources.data?.length ?? 0,
      },
      state: state.data ?? null,
      logs: logs.data ?? [],
      sources: sources.data ?? [],
    };
  });

export const listAdminArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string; q?: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let query = context.supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(80);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.q && data.q.trim().length > 1) query = query.ilike("title", `%${data.q.trim()}%`);
    const { data: articles, error } = await query;
    if (error) throw new Error(error.message);
    return { articles: articles ?? [] };
  });

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string;
      title: string;
      summary?: string;
      content?: string;
      image_url?: string;
      category_slug: string;
      source_name?: string;
      original_url?: string;
      status?: string;
      featured?: boolean;
      is_breaking?: boolean;
      published_at?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;

    if (id) {
      const { error } = await context.supabase.from("articles").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }

    const base = fields.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 70);
    const suffix = Math.random().toString(36).slice(2, 8);

    const { data: inserted, error } = await context.supabase
      .from("articles")
      .insert({
        ...fields,
        slug: `${base || "story"}-${suffix}`,
        dedupe_hash: `manual-${suffix}-${Date.now().toString(36)}`,
        auto_collected: false,
        source_name: fields.source_name || "ViralSuperMart Desk",
        published_at: fields.published_at || new Date().toISOString(),
        status: fields.status || "approved",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id as string };
  });

export const setArticleStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("articles")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleArticleFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; field: "featured" | "is_breaking"; value: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch =
      data.field === "featured" ? { featured: data.value } : { is_breaking: data.value };
    const { error } = await context.supabase.from("articles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string;
      name: string;
      feed_url: string;
      site_url?: string;
      default_category?: string;
      enabled?: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("sources").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("sources").insert(fields);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("sources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCollectorPaused = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { paused: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("collector_state")
      .update({ paused: data.paused })
      .eq("id", "collector");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const forceRefresh = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { runCollection } = await import("@/lib/collector.server");
    const result = await runCollection("manual");
    return result;
  });

export const listImageLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("articles")
      .select("id,title,image_url,source_name,published_at")
      .not("image_url", "is", null)
      .order("published_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return { images: data ?? [] };
  });

export const saveDigest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { title: string; intro?: string; article_ids: string[] }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await context.supabase.from("digests").upsert(
      {
        digest_date: today,
        title: data.title,
        intro: data.intro ?? null,
        article_ids: data.article_ids,
        published: true,
      },
      { onConflict: "digest_date" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Translates a batch of articles that still lack Hindi text. Repeatable until remaining = 0. */
export const backfillHindi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("articles")
      .select("id,title,summary,content")
      .is("title_hi", null)
      .order("published_at", { ascending: false })
      .limit(20);

    if (!rows || rows.length === 0) return { translated: 0, remaining: 0 };

    const { translateArticlesToHindi } = await import("@/lib/translate.server");
    const translated = await translateArticlesToHindi(
      supabaseAdmin,
      rows as { id: string; title: string; summary: string | null; content: string | null }[],
    );

    const { count } = await supabaseAdmin
      .from("articles")
      .select("id", { count: "exact", head: true })
      .is("title_hi", null);

    return { translated, remaining: count ?? 0 };
  });

/** Removes a live-chat message. Admin-only; the chat hides everyone's messages instantly. */
export const deleteChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("chat_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
