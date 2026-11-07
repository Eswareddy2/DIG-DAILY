const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  hellip: "…", bull: "•", middot: "·", dagger: "†", Dagger: "‡",
  copy: "©", reg: "®", trade: "™", deg: "°", plusmn: "±", micro: "µ",
  para: "¶", sect: "§", laquo: "«", raquo: "»", times: "×", divide: "÷",
  frac14: "¼", frac12: "½", frac34: "¾", iexcl: "¡", iquest: "¿",
  cent: "¢", pound: "£", yen: "¥", euro: "€", permil: "‰", prime: "′", Prime: "″",
  szlig: "ß", agrave: "à", aacute: "á", egrave: "è", eacute: "é",
  ccedil: "ç", ntilde: "ñ", auml: "ä", ouml: "ö", uuml: "ü",
  Agrave: "À", Aacute: "Á", Egrave: "È", Eacute: "É", Ccedil: "Ç",
  Ntilde: "Ñ", Auml: "Ä", Ouml: "Ö", Uuml: "Ü",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Decodes numeric and common named HTML entities; safe to run on already-clean text. */
export function decodeEntities(value: string): string {
  if (!value || !value.includes("&")) return value;
  const decoded = value
    .replace(/&#(\d+);/g, (m, n) => {
      const code = Number(n);
      return code >= 32 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    })
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (m, h) => {
      const code = parseInt(h, 16);
      return code >= 32 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    })
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => NAMED_ENTITIES[name] ?? m);
  return decoded !== value && decoded.includes("&") ? decodeEntities(decoded) : decoded;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function fullDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const utc = new Date(iso).getTime();
  const ist = new Date(utc + 5.5 * 60 * 60 * 1000);
  const weekday = WEEKDAYS[ist.getUTCDay()];
  const month = MONTHS[ist.getUTCMonth()];
  const hours = ist.getUTCHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const minutes = ist.getUTCMinutes().toString().padStart(2, "0");
  return `${weekday}, ${ist.getUTCDate()} ${month} ${ist.getUTCFullYear()} at ${displayHours}:${minutes} ${ampm}`;
}
