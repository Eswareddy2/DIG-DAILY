import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/** Signed-out placeholder only. Never contacts a service or saves user data. */
export function createSampleClient(): SupabaseClient<Database> {
  const unavailable = async () => ({
    data: { user: null, session: null },
    error: { message: 'Login is unavailable in sample mode. The service has not been configured.' },
  });
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: unavailable,
      signUp: unavailable,
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  } as unknown as SupabaseClient<Database>;
}
