DROP POLICY IF EXISTS "logs public read" ON public.collection_logs;
REVOKE SELECT ON public.collection_logs FROM PUBLIC, anon;

DROP POLICY IF EXISTS "collector state public read" ON public.collector_state;
REVOKE SELECT ON public.collector_state FROM PUBLIC, anon;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_admin_idx
  ON public.user_roles (role)
  WHERE role = 'admin'::public.app_role;