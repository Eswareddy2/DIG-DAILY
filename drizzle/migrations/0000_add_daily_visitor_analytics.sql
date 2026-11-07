CREATE TABLE public.site_visits (
  visitor_id uuid NOT NULL,
  visit_day date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  path text NOT NULL,
  CONSTRAINT site_visits_pkey PRIMARY KEY (visitor_id, visit_day),
  CONSTRAINT site_visits_path_valid CHECK (char_length(path) BETWEEN 1 AND 300 AND left(path, 1) = '/')
);
GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a daily visit" ON public.site_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX site_visits_visited_at_idx ON public.site_visits (visited_at DESC);
CREATE OR REPLACE FUNCTION public.get_admin_site_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'visitorsTotal', (SELECT count(DISTINCT visitor_id) FROM public.site_visits),
    'visitors24h', (SELECT count(DISTINCT visitor_id) FROM public.site_visits WHERE visited_at >= now() - interval '24 hours'),
    'visitors7d', (SELECT count(DISTINCT visitor_id) FROM public.site_visits WHERE visited_at >= now() - interval '7 days'),
    'dailyVisitors', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('date', days.day::text, 'visitors', coalesce(daily.visitors, 0)) ORDER BY days.day), '[]'::jsonb)
      FROM generate_series((now() AT TIME ZONE 'UTC')::date - 6, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS days(day)
      LEFT JOIN (
        SELECT visit_day, count(DISTINCT visitor_id) AS visitors
        FROM public.site_visits
        WHERE visit_day >= (now() AT TIME ZONE 'UTC')::date - 6
        GROUP BY visit_day
      ) AS daily ON daily.visit_day = days.day::date
    ),
    'readsTotal', (SELECT count(*) FROM public.page_views),
    'reads24h', (SELECT count(*) FROM public.page_views WHERE viewed_at >= now() - interval '24 hours'),
    'reads7d', (SELECT count(*) FROM public.page_views WHERE viewed_at >= now() - interval '7 days'),
    'dailyReads', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('date', days.day::text, 'views', coalesce(daily.views, 0)) ORDER BY days.day), '[]'::jsonb)
      FROM generate_series((now() AT TIME ZONE 'UTC')::date - 6, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS days(day)
      LEFT JOIN (
        SELECT (viewed_at AT TIME ZONE 'UTC')::date AS view_day, count(*) AS views
        FROM public.page_views
        WHERE viewed_at >= now() - interval '7 days'
        GROUP BY (viewed_at AT TIME ZONE 'UTC')::date
      ) AS daily ON daily.view_day = days.day::date
    ),
    'topStories', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', ranked.id, 'title', ranked.title, 'slug', ranked.slug, 'views', ranked.views) ORDER BY ranked.views DESC), '[]'::jsonb)
      FROM (
        SELECT a.id, a.title, a.slug, count(*) AS views
        FROM public.page_views AS pv
        JOIN public.articles AS a ON a.id = pv.article_id
        WHERE pv.viewed_at >= now() - interval '7 days'
        GROUP BY a.id, a.title, a.slug
        ORDER BY count(*) DESC
        LIMIT 12
      ) AS ranked
    )
  ) INTO result;

  RETURN result;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_admin_site_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_site_analytics() TO authenticated, service_role;