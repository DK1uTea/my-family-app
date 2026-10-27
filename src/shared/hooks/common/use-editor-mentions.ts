import type { RefObject } from 'react';
import { useState } from 'react';
import type { Editor as TiptapEditor } from '@tiptap/react';

import type { EditorMentionItem } from '@/shared/components/ui/editor-mention-dropdown';

type MentionState = {
  active: boolean;
  query: string;
  index: number;
  position: { top: number; left: number };
};

const CLOSED_MENTION: MentionState = { active: false, query: '', index: 0, position: { top: 0, left: 0 } };

export function useEditorMentions(
  editorRef: RefObject<TiptapEditor | null>,
  mentionItems?: EditorMentionItem[],
) {
  const [mention, setMention] = useState<MentionState>(CLOSED_MENTION);
  const filteredMentions = (mentionItems ?? []).filter((item) =>
    item.label.toLowerCase().includes(mention.query.toLowerCase()),
  );

  const getPosition = () => {
    const editor = editorRef.current;
    if (!editor) return { top: 0, left: 0 };
    const coords = editor.view.coordsAtPos(editor.state.selection.from);
    const editorRect = editor.view.dom.getBoundingClientRect();
    return { top: coords.bottom - editorRect.top + 4, left: coords.left - editorRect.left };
  };

  const insertMention = (item: EditorMentionItem) => {
    const editor = editorRef.current;
    if (!editor) return;
    const { from } = editor.state.selection;
    const atIndex = editor.state.doc.textBetween(0, from, '\n', '\0').lastIndexOf('@');
    if (atIndex === -1) return;
    editor.chain().focus().deleteRange({ from: atIndex + 1, to: from }).insertContent([
      {
        type: 'text',
        marks: [{
          type: 'link',
          attrs: {
            href: `mention://${item.id}`,
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
            class: 'text-primary underline mention-tag font-medium no-underline cursor-default',
          },
        }],
        text: `@${item.label}`,
      },
      { type: 'text', text: ' ' },
    ]).run();
    setMention(CLOSED_MENTION);
  };

  const updateMention = (editor: TiptapEditor) => {
    if (!mentionItems?.length) return;
    const { from } = editor.state.selection;
    const match = editor.state.doc.textBetween(0, from, '\n', '\0').match(/@([\w]*)$/);
    if (match) {
      setMention({ active: true, query: match[1] ?? '', index: 0, position: getPosition() });
    } else {
      setMention((previous) => previous.active ? CLOSED_MENTION : previous);
    }
  };

  const handleMentionKeyDown = (event: KeyboardEvent): boolean => {
    if (!mention.active || !filteredMentions.length) return false;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setMention((previous) => ({
        ...previous,
        index: Math.max(0, Math.min(previous.index + delta, filteredMentions.length - 1)),
      }));
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = filteredMentions[mention.index];
      if (item) insertMention(item);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setMention(CLOSED_MENTION);
      return true;
    }
    return false;
  };

  return { mention, filteredMentions, insertMention, updateMention, handleMentionKeyDown, setMention };
}
