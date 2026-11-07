import type { SupabaseClient } from "@supabase/supabase-js";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const BATCH_SIZE = 10;

type Translated = { title_hi: string; summary_hi: string | null; content_hi: string | null };
type TranslationInput = { title: string; summary: string | null; content: string | null };

async function translateBatch(items: TranslationInput[]): Promise<Translated[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return [];

  const list = items
    .map((it, i) => `${i + 1}. TITLE: ${it.title}\nSUMMARY: ${(it.summary ?? "").slice(0, 240)}\nARTICLE: ${(it.content ?? "").slice(0, 3000)}`)
    .join("\n\n");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'You are a Hindi news editor at a digital-marketing news site. Translate every item into natural, publication-quality Hindi (Devanagari script) — a real translation, not transliteration. Keep brand and product names (Google, Meta, YouTube) and widely used technical terms (SEO, PPC, AI, CTR) in Latin script where that is common practice in Indian media. Preserve the meaning and factual detail. title_hi is a crisp Hindi headline, summary_hi is 1-2 Hindi sentences, and content_hi is the complete article body in Hindi with the same paragraph breaks where possible. Return ONLY valid JSON in this exact shape: {"items":[{"title_hi":"...","summary_hi":"...","content_hi":"..."}]} in the same order as the input.',
        },
        {
          role: "user",
          content: `Translate these ${items.length} news items into Hindi:\n\n${list}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) throw new Error(`AI gateway HTTP ${response.status}`);
  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  const match = /\[[\s\S]*\]/.exec(content);
  if (!match) return [];

  const arr = JSON.parse(match[0]) as { title_hi?: string; summary_hi?: string; content_hi?: string }[];
  return items.map((item, i) => {
    const t = arr[i];
    return {
      title_hi: typeof t?.title_hi === "string" && t.title_hi.trim().length > 0 ? t.title_hi.trim() : item.title,
      summary_hi: typeof t?.summary_hi === "string" && t.summary_hi.trim().length > 0 ? t.summary_hi.trim() : null,
      content_hi: typeof t?.content_hi === "string" && t.content_hi.trim().length > 0 ? t.content_hi.trim() : null,
    };
  });
}

/** Translates article rows to Hindi and stores title_hi, summary_hi, and content_hi. */
export async function translateArticlesToHindi(
  supabase: SupabaseClient,
  rows: ({ id: string } & TranslationInput)[],
): Promise<number> {
  let translated = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    let results: Translated[];
    try {
      results = await translateBatch(chunk);
    } catch {
      break; // gateway hiccup — next run picks up the rest
    }
    for (let j = 0; j < chunk.length; j++) {
      const t = results[j];
      if (!t) continue;
      const { error } = await supabase
        .from("articles")
        .update({ title_hi: t.title_hi, summary_hi: t.summary_hi, content_hi: t.content_hi })
        .eq("id", chunk[j]!.id);
      if (!error) translated += 1;
    }
  }
  return translated;
}
