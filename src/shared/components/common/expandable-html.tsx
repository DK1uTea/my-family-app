'use client';

import { useState } from 'react';
import { sanitizeHtmlForEditor } from '@/lib/html-utils';

const DEFAULT_MAX_CHARS = 200;

type Props = {
  html?: string;
  maxChars?: number;
  seeMoreLabel: string;
  seeLessLabel: string;
  className?: string;
};

export function ExpandableHtml({
  html,
  maxChars = DEFAULT_MAX_CHARS,
  seeMoreLabel,
  seeLessLabel,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const clean = html ? sanitizeHtmlForEditor(html) : '';
  if (!clean) return null;

  const isOverflowing = clean.length > maxChars;

  if (!isOverflowing) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  return (
    <div className={className}>
      <div
        className={expanded ? undefined : 'line-clamp-3'}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      <button
        type="button"
        className="mt-1 text-sm text-primary underline"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? seeLessLabel : seeMoreLabel}
      </button>
    </div>
  );
}
