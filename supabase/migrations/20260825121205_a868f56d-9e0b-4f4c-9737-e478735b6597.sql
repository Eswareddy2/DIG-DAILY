-- roles
CREATE TYPE public.app_role AS ENUM ('admin','editor','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- shared updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_hi text,
  color text NOT NULL DEFAULT '#FF5A5F',
  sort_order int NOT NULL DEFAULT 0,
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- sources
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  site_url text,
  feed_url text NOT NULL UNIQUE,
  logo_url text,
  kind text NOT NULL DEFAULT 'rss',
  default_category text,
  enabled boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources public read" ON public.sources FOR SELECT USING (true);
CREATE POLICY "sources admin write" ON public.sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER sources_updated_at BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- articles
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_hi text,
  summary text,
  content text,
  image_url text,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  source_name text NOT NULL DEFAULT 'DigiDaily',
  original_url text,
  category_slug text NOT NULL DEFAULT 'tools',
  published_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'approved',
  featured boolean NOT NULL DEFAULT false,
  is_breaking boolean NOT NULL DEFAULT false,
  auto_collected boolean NOT NULL DEFAULT true,
  dedupe_hash text NOT NULL UNIQUE,
  view_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX articles_published_idx ON public.articles (published_at DESC);
CREATE INDEX articles_status_idx ON public.articles (status);
CREATE INDEX articles_category_idx ON public.articles (category_slug);
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles public read approved" ON public.articles
  FOR SELECT USING (status = 'approved');
CREATE POLICY "articles admin read all" ON public.articles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "articles admin write" ON public.articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- collection logs
CREATE TABLE public.collection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  trigger text NOT NULL DEFAULT 'cron',
  sources_checked int NOT NULL DEFAULT 0,
  items_found int NOT NULL DEFAULT 0,
  items_added int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  message text
);
CREATE INDEX collection_logs_started_idx ON public.collection_logs (started_at DESC);
GRANT SELECT ON public.collection_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_logs TO authenticated;
GRANT ALL ON public.collection_logs TO service_role;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs public read" ON public.collection_logs FOR SELECT USING (true);
CREATE POLICY "logs admin write" ON public.collection_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- collector single-flight state
CREATE TABLE public.collector_state (
  id text PRIMARY KEY,
  locked_until timestamptz,
  last_run_at timestamptz,
  paused boolean NOT NULL DEFAULT false,
  note text
);
GRANT SELECT ON public.collector_state TO anon;
GRANT SELECT, UPDATE ON public.collector_state TO authenticated;
GRANT ALL ON public.collector_state TO service_role;
ALTER TABLE public.collector_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collector state public read" ON public.collector_state FOR SELECT USING (true);
CREATE POLICY "collector state admin write" ON public.collector_state FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.collector_state (id) VALUES ('collector');

-- digests
CREATE TABLE public.digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date date NOT NULL UNIQUE,
  title text NOT NULL,
  intro text,
  article_ids uuid[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.digests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digests TO authenticated;
GRANT ALL ON public.digests TO service_role;
ALTER TABLE public.digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "digests public read" ON public.digests FOR SELECT USING (published = true);
CREATE POLICY "digests admin write" ON public.digests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER digests_updated_at BEFORE UPDATE ON public.digests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed categories
INSERT INTO public.categories (slug, name, name_hi, color, sort_order, keywords) VALUES
 ('algorithm-updates','Algorithm Updates','एल्गोरिदम अपडेट','#FF5A5F',1,'{algorithm,core update,ranking update,penalty,spam update}'),
 ('seo','SEO','एसईओ','#0A2540',2,'{seo,search console,serp,backlink,keyword,organic,indexing,crawl}'),
 ('paid-ads','Paid Ads','पेड ऐड्स','#B8860B',3,'{google ads,ppc,cpc,adwords,paid search,performance max,bidding,ad spend}'),
 ('social-media','Social Media','सोशल मीडिया','#1D6FB8',4,'{instagram,facebook,meta,linkedin,tiktok,twitter,threads,youtube,social}'),
 ('ai-marketing','AI Marketing','एआई मार्केटिंग','#6C4BD6',5,'{ai,chatgpt,gemini,llm,automation,generative,copilot}'),
 ('analytics','Analytics','एनालिटिक्स','#0F766E',6,'{analytics,ga4,attribution,measurement,tracking,conversion}'),
 ('content','Content','कंटेंट','#9A3412',7,'{content marketing,blog,newsletter,copywriting,video marketing}'),
 ('tools','Tools','टूल्स','#475569',8,'{tool,platform,launch,feature,integration,update}');

-- seed sources
INSERT INTO public.sources (name, site_url, feed_url, default_category) VALUES
 ('Search Engine Journal','https://www.searchenginejournal.com','https://www.searchenginejournal.com/feed/','seo'),
 ('Search Engine Land','https://searchengineland.com','https://searchengineland.com/feed','seo'),
 ('Search Engine Roundtable','https://www.seroundtable.com','https://www.seroundtable.com/index.rdf','algorithm-updates'),
 ('Google Search Central','https://developers.google.com/search','https://developers.google.com/search/blog/feed.xml','algorithm-updates'),
 ('Google Ads Blog','https://blog.google','https://blog.google/products/ads-commerce/rss/','paid-ads'),
 ('Social Media Today','https://www.socialmediatoday.com','https://www.socialmediatoday.com/feeds/news/','social-media'),
 ('Marketing Dive','https://www.marketingdive.com','https://www.marketingdive.com/feeds/news/','content'),
 ('HubSpot Marketing Blog','https://blog.hubspot.com','https://blog.hubspot.com/marketing/rss.xml','content'),
 ('Moz Blog','https://moz.com','https://moz.com/posts/rss/blog','seo'),
 ('Ahrefs Blog','https://ahrefs.com/blog','https://ahrefs.com/blog/feed/','seo'),
 ('Semrush Blog','https://www.semrush.com/blog','https://www.semrush.com/blog/feed/','tools'),
 ('WordStream Blog','https://www.wordstream.com','https://www.wordstream.com/blog/feed','paid-ads'),
 ('YouTube Official Blog','https://blog.youtube','https://blog.youtube/rss/','social-media'),
 ('TechCrunch Marketing','https://techcrunch.com','https://techcrunch.com/category/startups/feed/','ai-marketing');