import { useEffect, useState } from "react";
import { fullDate, timeAgo } from "@/lib/format";

export function TimeAgo({ iso }: { iso: string | null | undefined }) {
  const [text, setText] = useState(() => fullDate(iso));
  useEffect(() => {
    setText(timeAgo(iso));
    const id = setInterval(() => setText(timeAgo(iso)), 60000);
    return () => clearInterval(id);
  }, [iso]);
  return <time dateTime={iso ?? undefined}>{text}</time>;
}
