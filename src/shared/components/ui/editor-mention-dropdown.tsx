'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

export type EditorMentionItem = {
  id: string;
  label: string;
  avatarUrl?: string | null;
};

type Props = {
  items: EditorMentionItem[];
  activeIndex: number;
  position: { top: number; left: number };
  onSelect: (item: EditorMentionItem) => void;
  onHover: (index: number) => void;
};

export function EditorMentionDropdown({ items, activeIndex, position, onSelect, onHover }: Props) {
  if (items.length === 0) return null;

  return (
    <div
      className="absolute z-50 max-h-52 w-64 overflow-y-auto _custom-scroll rounded-lg border border-border bg-popover py-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          data-active={index === activeIndex}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          onMouseEnter={() => onHover(index)}
          className={
            index === activeIndex
              ? 'flex w-full items-center gap-2 bg-muted px-3 py-2 text-left text-sm'
              : 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'
          }
        >
          <Avatar size="sm">
            {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.label} />}
            <AvatarFallback>{item.label.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-foreground">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
