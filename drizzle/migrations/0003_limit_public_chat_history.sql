DROP POLICY IF EXISTS "anyone can read chat" ON public.chat_messages;
CREATE POLICY "public can read recent chat" ON public.chat_messages
  FOR SELECT TO public
  USING (created_at > now() - interval '7 days');