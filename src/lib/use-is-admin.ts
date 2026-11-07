import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminStatus } from "@/lib/admin.functions";

/**
 * True only when the signed-in visitor holds the admin role.
 * Signed-out visitors never call the protected server function, so there is
 * no failed-request noise; the buttons simply stay hidden for them.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session || cancelled) return;
        const status = await getMyAdminStatus();
        if (!cancelled) setIsAdmin(status.isAdmin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
