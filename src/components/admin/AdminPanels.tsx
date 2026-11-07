import { Link, } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteArticle,
  deleteSource,
  listAdminArticles,
  saveArticle,
  saveDigest,
  saveSource,
  setArticleStatus,
  toggleArticleFlag,
} from "@/lib/admin.functions";
import { getCategories, type Category } from "@/lib/news.functions";

export type AdminSource = {
  id: string;
  name: string;
  feed_url: string;
  site_url: string | null;
  default_category: string | null;
  enabled: boolean | null;
};

type AdminArticle = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  slug: string;
  category_slug: string;
  source_name: string | null;
  status: string;
  featured: boolean | null;
  is_breaking: boolean | null;
  published_at: string;
};

const inputClass = "h-9 rounded-none text-sm";
const labelClass = "text-[11px] font-bold uppercase tracking-widest text-muted-foreground";

function useCategoryOptions() {
  const fetchCategories = useServerFn(getCategories);
  const categories = useQuery({ queryKey: ["admin-categories"], queryFn: () => fetchCategories(), staleTime: 300_000 });
  return (categories.data?.categories ?? []) as Category[];
}

function Note({ note }: { note: string }) {
  if (!note) return null;
  return (
    <p className="w-full text-sm text-ink-soft" role="status">
      {note}
    </p>
  );
}

/* ---------------- Stories ---------------- */

export function StoriesPanel() {
  const queryClient = useQueryClient();
  const fetchArticles = useServerFn(listAdminArticles);
  const save = useServerFn(saveArticle);
  const setStatus = useServerFn(setArticleStatus);
  const toggleFlag = useServerFn(toggleArticleFlag);
  const remove = useServerFn(deleteArticle);
  const categoryOptions = useCategoryOptions();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminArticle | null>(null);
  const [creating, setCreating] = useState(false);

  const articles = useQuery({
    queryKey: ["admin-articles", statusFilter, query],
    queryFn: () => fetchArticles({ data: { status: statusFilter, q: query } }),
  });

  async function run(id: string, fn: () => Promise<unknown>, noteText: string) {
    setBusyId(id);
    setNote("");
    try {
      await fn();
      setNote(noteText);
      await queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const rows = articles.data?.articles ?? [];

  return (
    <section className="mt-8 border border-rule bg-card p-6">
      <h2 className="border-b border-rule pb-2 font-display text-2xl font-bold text-ink">Stories</h2>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search);
          }}
        >
          <label className={labelClass}>
            Search
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Headline contains…" className={`${inputClass} mt-1 w-56`} />
          </label>
          <Button type="submit" size="sm" className="rounded-none text-[11px] uppercase tracking-widest">
            Search
          </Button>
        </form>
        <label className={labelClass}>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`mt-1 h-9 border border-rule bg-background px-2 text-sm text-ink ${inputClass}`}
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </label>
        <Button size="sm" variant="outline" className="rounded-none text-[11px] uppercase tracking-widest" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> New story
        </Button>
      </div>

      <Note note={note} />

      {(creating || editing) && (
        <ArticleForm
          article={editing}
          categories={categoryOptions}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async (message) => {
            setCreating(false);
            setEditing(null);
            setNote(message);
            await queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
            await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
          }}
          save={save}
        />
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-rule text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-4">Story</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Flags</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((article) => (
              <tr key={article.id} className="border-b border-rule/60 align-top">
                <td className="max-w-md py-2 pr-4">
                  <Link to="/article/$slug" params={{ slug: article.slug }} className="font-serif text-sm text-ink hover:text-accent">
                    {article.title}
                  </Link>
                  <p className="text-[10px] text-muted-foreground">
                    {article.source_name ?? "—"} · {article.category_slug}
                  </p>
                </td>
                <td className="py-2 pr-4">
                  <span className={article.status === "approved" ? "text-accent" : "text-destructive"}>{article.status}</span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => run(article.id, () => toggleFlag({ data: { id: article.id, field: "featured", value: !article.featured } }), "Story updated")}
                      className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${article.featured ? "border-accent text-accent" : "border-rule text-muted-foreground"}`}
                    >
                      Featured
                    </button>
                    <button
                      type="button"
                      onClick={() => run(article.id, () => toggleFlag({ data: { id: article.id, field: "is_breaking", value: !article.is_breaking } }), "Story updated")}
                      className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${article.is_breaking ? "border-live text-live" : "border-rule text-muted-foreground"}`}
                    >
                      Breaking
                    </button>
                  </div>
                </td>
                <td className="py-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {busyId === article.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
                    {article.status !== "approved" && (
                      <Button size="sm" variant="ghost" className="h-7 rounded-none px-2 text-[10px] uppercase tracking-wide" onClick={() => run(article.id, () => setStatus({ data: { id: article.id, status: "approved" } }), "Story approved")}>
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 rounded-none px-2 text-[10px] uppercase tracking-wide" onClick={() => { setEditing(article); setCreating(false); }}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-none px-2 text-[10px] uppercase tracking-wide text-destructive"
                      onClick={() => {
                        if (window.confirm(`Delete “${article.title}”?`)) {
                          void run(article.id, () => remove({ data: { id: article.id } }), "Story deleted");
                        }
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-sm text-muted-foreground">
                  {articles.isLoading ? "Loading…" : "No stories match this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ArticleForm({
  article,
  categories,
  onClose,
  onSaved,
  save,
}: {
  article: AdminArticle | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void | Promise<void>;
  save: ReturnType<typeof useServerFn<typeof saveArticle>>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: article?.title ?? "",
    summary: article?.summary ?? "",
    content: article?.content ?? "",
    image_url: article?.image_url ?? "",
    category_slug: article?.category_slug ?? (categories[0]?.slug ?? "tools"),
    source_name: article?.source_name ?? "",
    status: article?.status ?? "approved",
  });

  const field = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await save({
        data: {
          ...(article ? { id: article.id } : {}),
          title: form.title,
          category_slug: form.category_slug,
          status: form.status,
          ...(form.summary ? { summary: form.summary } : {}),
          ...(form.content ? { content: form.content } : {}),
          ...(form.image_url ? { image_url: form.image_url } : {}),
          ...(form.source_name ? { source_name: form.source_name } : {}),
        },
      });
      await onSaved(article ? "Story updated." : "Story created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border border-rule bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{article ? "Edit story" : "New story"}</p>
        <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close form">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <label className={`${labelClass} block`}>
        Headline
        <Input required value={form.title} onChange={field("title")} className={`${inputClass} mt-1`} />
      </label>
      <label className={`${labelClass} block`}>
        Summary
        <Input value={form.summary} onChange={field("summary")} className={`${inputClass} mt-1`} />
      </label>
      <label className={`${labelClass} block`}>
        Body
        <textarea value={form.content} onChange={field("content")} rows={4} className="mt-1 w-full border border-rule bg-background p-2 text-sm text-ink" />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className={`${labelClass} block`}>
          Category
          <select value={form.category_slug} onChange={field("category_slug")} className={`mt-1 w-full border border-rule bg-background px-2 text-sm text-ink ${inputClass}`}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} block`}>
          Source name
          <Input value={form.source_name} onChange={field("source_name")} placeholder="ViralSuperMart Desk" className={`${inputClass} mt-1`} />
        </label>
        <label className={`${labelClass} block`}>
          Image URL
          <Input value={form.image_url} onChange={field("image_url")} className={`${inputClass} mt-1`} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <label className={`${labelClass}`}>
          Status
          <select value={form.status} onChange={field("status")} className={`ml-2 border border-rule bg-background px-2 text-sm text-ink ${inputClass}`}>
            <option value="approved">approved</option>
            <option value="pending">pending</option>
          </select>
        </label>
        <Button type="submit" size="sm" disabled={busy} className="rounded-none text-[11px] uppercase tracking-widest">
          <Save className="mr-1 h-3.5 w-3.5" /> {busy ? "Saving…" : "Save story"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}

/* ---------------- Sources ---------------- */

export function SourcesPanel({ sources }: { sources: AdminSource[] }) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveSource);
  const remove = useServerFn(deleteSource);
  const categoryOptions = useCategoryOptions();

  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminSource | null>(null);
  const [adding, setAdding] = useState(false);

  async function run(id: string, fn: () => Promise<unknown>, noteText: string) {
    setBusyId(id);
    setNote("");
    try {
      await fn();
      setNote(noteText);
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-8 border border-rule bg-card p-6">
      <h2 className="border-b border-rule pb-2 font-display text-2xl font-bold text-ink">Sources</h2>

      <div className="mt-4">
        <Button size="sm" variant="outline" className="rounded-none text-[11px] uppercase tracking-widest" onClick={() => setAdding(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add source
        </Button>
      </div>

      <Note note={note} />

      {(adding || editing) && (
        <SourceForm
          source={editing}
          categories={categoryOptions}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={async (message) => {
            setAdding(false);
            setEditing(null);
            setNote(message);
            await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
          }}
          save={save}
        />
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-rule text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Feed</th>
              <th className="py-2 pr-4">Enabled</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-b border-rule/60">
                <td className="py-2 pr-4 font-semibold text-ink">{source.name}</td>
                <td className="max-w-xs truncate py-2 pr-4 text-muted-foreground">{source.feed_url}</td>
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        source.id,
                        () =>
                          save({
                            data: {
                              id: source.id,
                              name: source.name,
                              feed_url: source.feed_url,
                              ...(source.site_url ? { site_url: source.site_url } : {}),
                              ...(source.default_category ? { default_category: source.default_category } : {}),
                              enabled: !source.enabled,
                            },
                          }),
                        source.enabled ? "Source disabled" : "Source enabled",
                      )
                    }
                    className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${source.enabled ? "border-accent text-accent" : "border-rule text-muted-foreground"}`}
                  >
                    {source.enabled ? "On" : "Off"}
                  </button>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    {busyId === source.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
                    <Button size="sm" variant="ghost" className="h-7 rounded-none px-2 text-[10px] uppercase tracking-wide" onClick={() => { setEditing(source); setAdding(false); }}>
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-none px-2 text-[10px] uppercase tracking-wide text-destructive"
                      onClick={() => {
                        if (window.confirm(`Delete source “${source.name}”?`)) {
                          void run(source.id, () => remove({ data: { id: source.id } }), "Source deleted");
                        }
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-sm text-muted-foreground">
                  No sources configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceForm({
  source,
  categories,
  onClose,
  onSaved,
  save,
}: {
  source: AdminSource | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void | Promise<void>;
  save: ReturnType<typeof useServerFn<typeof saveSource>>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: source?.name ?? "",
    feed_url: source?.feed_url ?? "",
    site_url: source?.site_url ?? "",
    default_category: source?.default_category ?? (categories[0]?.slug ?? "tools"),
    enabled: source?.enabled ?? true,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await save({
        data: {
          ...(source ? { id: source.id } : {}),
          name: form.name,
          feed_url: form.feed_url,
          ...(form.site_url ? { site_url: form.site_url } : {}),
          ...(form.default_category ? { default_category: form.default_category } : {}),
          enabled: form.enabled,
        },
      });
      await onSaved(source ? "Source updated." : "Source added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border border-rule bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{source ? "Edit source" : "New source"}</p>
        <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close form">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={`${labelClass} block`}>
          Name
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${inputClass} mt-1`} />
        </label>
        <label className={`${labelClass} block`}>
          Feed URL
          <Input required type="url" value={form.feed_url} onChange={(e) => setForm((f) => ({ ...f, feed_url: e.target.value }))} className={`${inputClass} mt-1`} />
        </label>
        <label className={`${labelClass} block`}>
          Site URL
          <Input value={form.site_url} onChange={(e) => setForm((f) => ({ ...f, site_url: e.target.value }))} className={`${inputClass} mt-1`} />
        </label>
        <label className={`${labelClass} block`}>
          Default category
          <select value={form.default_category} onChange={(e) => setForm((f) => ({ ...f, default_category: e.target.value }))} className={`mt-1 w-full border border-rule bg-background px-2 text-sm text-ink ${inputClass}`}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
          Enabled
        </label>
        <Button type="submit" size="sm" disabled={busy} className="rounded-none text-[11px] uppercase tracking-widest">
          <Save className="mr-1 h-3.5 w-3.5" /> {busy ? "Saving…" : "Save source"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}

/* ---------------- Digest ---------------- */

export function DigestPanel() {
  const queryClient = useQueryClient();
  const fetchArticles = useServerFn(listAdminArticles);
  const publish = useServerFn(saveDigest);

  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const articles = useQuery({
    queryKey: ["admin-articles", "approved", ""],
    queryFn: () => fetchArticles({ data: { status: "approved", q: "" } }),
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) {
      setNote("Pick at least one story for the digest.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      await publish({
        data: {
          title: title || "Today's digital marketing briefing",
          ...(intro ? { intro } : {}),
          article_ids: selected,
        },
      });
      setNote("Digest published for today.");
      setSelected([]);
      await queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  const rows = articles.data?.articles ?? [];

  return (
    <section className="mt-8 border border-rule bg-card p-6">
      <h2 className="border-b border-rule pb-2 font-display text-2xl font-bold text-ink">Daily digest</h2>
      <p className="mt-2 text-sm text-ink-soft">Pick today's must-read stories and publish them as one briefing on the Digest page.</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className={`${labelClass} block`}>
            Digest title
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Today's digital marketing briefing" className={`${inputClass} mt-1`} />
          </label>
          <label className={`${labelClass} block`}>
            One-line intro
            <Input value={intro} onChange={(e) => setIntro(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
        </div>
        <div className="max-h-72 overflow-y-auto border border-rule bg-background p-2">
          {rows.map((article) => (
            <label key={article.id} className="flex cursor-pointer items-start gap-2 border-b border-rule/50 px-1 py-1.5 last:border-0">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(article.id)}
                onChange={(e) =>
                  setSelected((current) => (e.target.checked ? [...current, article.id] : current.filter((id) => id !== article.id)))
                }
              />
              <span className="font-serif text-sm text-ink">{article.title}</span>
            </label>
          ))}
          {rows.length === 0 && <p className="p-2 text-sm text-muted-foreground">{articles.isLoading ? "Loading…" : "No approved stories yet."}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy} className="rounded-none text-[11px] uppercase tracking-widest">
            <Check className="mr-1 h-3.5 w-3.5" /> {busy ? "Publishing…" : `Publish digest (${selected.length} selected)`}
          </Button>
          <Note note={note} />
        </div>
      </form>
    </section>
  );
}
