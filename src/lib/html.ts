const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

const HTML_UNESCAPE_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
};

export function escapeHTML(value?: string | null) {
  if (!value) return "";

  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function unescapeHTML(value?: string | null) {
  if (!value) return "";

  return value.replace(
    /&(amp|lt|gt|quot);|&#0?39;/g,
    (entity) => HTML_UNESCAPE_MAP[entity] ?? entity,
  );
}
