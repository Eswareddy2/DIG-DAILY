CREATE TABLE public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'Guest',
  body text not null,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read chat" ON public.chat_messages
  FOR SELECT TO public USING (true);

CREATE POLICY "anyone can post an opinion" ON public.chat_messages
  FOR INSERT TO public
  WITH CHECK (char_length(body) BETWEEN 1 AND 500 AND char_length(display_name) <= 40);

CREATE INDEX chat_messages_created_at_idx ON public.chat_messages (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;