import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Verifies the bearer token presented by the database scheduler against the
 * single token row stored in public.cron_tokens. The token never leaves the
 * database except inside the scheduled HTTPS call to this endpoint.
 */
export async function authorizeWithDatabaseToken(
  request: Request,
): Promise<boolean> {
  const match = /^Bearer ([^\s,]+)$/.exec(
    request.headers.get("authorization") ?? "",
  );
  const token = match?.[1];
  if (!token) return false;

  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    // cron_tokens is provisioned outside the generated types; cast narrowly.
    const client = supabaseAdmin as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: boolean) => {
            maybeSingle: () => Promise<{
              data: { token: string } | null;
              error: unknown;
            }>;
          };
        };
      };
    };
    const { data, error } = await client
      .from("cron_tokens")
      .select("token")
      .eq("id", true)
      .maybeSingle();
    if (error || !data?.token) return false;

    const digest = (value: string) =>
      createHash("sha256").update(value, "utf8").digest();
    return timingSafeEqual(digest(token), digest(data.token));
  } catch {
    return false;
  }
}
