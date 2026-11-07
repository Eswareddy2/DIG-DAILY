import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { authorizeWithDatabaseToken } from "@/lib/cron-token.server";

export const Route = createFileRoute("/api/public/hooks/collect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorized = await authorizeWithDatabaseToken(request);
        if (!authorized) {
          const unauthorized = await authenticateCronRequest(request);
          if (unauthorized) return unauthorized;
        }

        const { runCollection } = await import("@/lib/collector.server");
        try {
          const result = await runCollection("cron");
          return Response.json({ ok: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("collection failed", message);
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
