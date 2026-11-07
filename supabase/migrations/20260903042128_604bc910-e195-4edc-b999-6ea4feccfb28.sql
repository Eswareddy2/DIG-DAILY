alter table public.articles add column if not exists title_hi text, add column if not exists summary_hi text;

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade not null,
  viewed_at timestamptz not null default now(),
  referrer text
);
create index if not exists page_views_article_idx on public.page_views(article_id);
create index if not exists page_views_viewed_at_idx on public.page_views(viewed_at desc);

grant insert on public.page_views to anon;
grant select, insert on public.page_views to authenticated;
grant all on public.page_views to service_role;

alter table public.page_views enable row level security;

create policy "anyone can record a view"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

create policy "admins can read views"
  on public.page_views for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));