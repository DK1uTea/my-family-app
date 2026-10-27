export function unescapeHtmlEntities(html: string): string {
  if (!html || typeof html !== 'string') return html;
  const trimmed = html.trim();
  if (!trimmed.includes('&lt;')) return html;
  return trimmed
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

export function sanitizeHtmlForEditor(html: string): string {
  if (!html || typeof html !== 'string') return html;
  html = unescapeHtmlEntities(html);

  let clean = html;
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<frame\b[^<]*(?:(?!<\/frame>)<[^<]*)*<\/frame>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^"'>\s]*)/gi, '');
  clean = clean.replace(
    /(href|src|action)\s*=\s*["']\s*(javascript|data|vbscript):[^"']*["']/gi,
    '$1="#"',
  );
  return clean;
}

/**
 * Strips HTML tags down to plain, single-line text — for contexts too small to
 * render real markup (a truncated calendar-cell label, a list preview), where
 * showing the raw `<p>...</p>` source instead of its text would be worse than
 * losing the formatting entirely.
 */
export function stripHtmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const unescaped = unescapeHtmlEntities(html);
  return unescaped
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractMentionedUserIds(html: string): string[] {
  if (!html || typeof html !== 'string') return [];

  const ids = new Set<string>();
  const regex = /href=["']mention:\/\/([^"']+)["']/gi;
  let match = regex.exec(html);
  while (match) {
    ids.add(match[1]);
    match = regex.exec(html);
  }

  return Array.from(ids);
}
