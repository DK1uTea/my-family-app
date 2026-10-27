'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { cn } from '@/lib/utils';
import { sanitizeHtmlForEditor } from '@/lib/html-utils';
import { EditorToolbar } from '@/shared/components/ui/editor-toolbar';
import { EditorMentionDropdown, type EditorMentionItem } from '@/shared/components/ui/editor-mention-dropdown';
import { useEditorMentions } from '@/shared/hooks/common/use-editor-mentions';

export type { EditorMentionItem };

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  /** Custom styles applied directly to the inner editor content container. */
  editorClassName?: string;
  /** Shows a Paragraph/Heading 1-3 block-type dropdown as the first toolbar group. */
  showHeadings?: boolean;
  autoFocus?: boolean;
  /** Moves focus into the editor after it mounts without using the native autofocus attribute. */
  focusOnMount?: boolean;
  /** Shows the image toolbar button. Falls back to a local object URL when omitted. */
  onImageUpload?: (file: File) => Promise<string | null>;
  /** Enables "@name" mention suggestions while typing. */
  mentionItems?: EditorMentionItem[];
  attachmentContent?: ReactNode;
  onFilesSelected?: (files: File[]) => void;
  fileAccept?: string;
  fileInputLabel?: string;
};

export function Editor({
  value = '', onChange, placeholder, disabled, error, className,
  editorClassName,
  showHeadings, autoFocus, focusOnMount, onImageUpload, mentionItems,
  attachmentContent, onFilesSelected, fileAccept, fileInputLabel,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TiptapEditor | null>(null);
  const mentions = useEditorMentions(editorRef, mentionItems);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: [{ scheme: 'mention', optionalSlashes: true }],
      }),
    ],
    content: sanitizeHtmlForEditor(value) || '',
    editable: !disabled,
    onUpdate({ editor: e }) {
      onChange?.(e.getHTML());
      mentions.updateMention(e);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        return mentions.handleMentionKeyDown(event);
      },
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(sanitizeHtmlForEditor(value) || '');
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if ((autoFocus || focusOnMount) && editor) editor.commands.focus('end');
  }, [autoFocus, focusOnMount, !!editor]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length || !editor) return;

    if (onFilesSelected) {
      onFilesSelected(files);
      return;
    }

    for (const file of files) {
      const src = onImageUpload ? await onImageUpload(file) : URL.createObjectURL(file);
      if (src) editor.chain().focus().setImage({ src }).run();
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-editor border bg-background transition-colors',
        error ? 'border-destructive' : 'border-input',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept ?? 'image/*'}
        multiple={Boolean(onFilesSelected)}
        aria-label={fileInputLabel}
        className="hidden"
        onChange={handleFileChange}
      />
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        showHeadings={showHeadings}
        onImageButtonClick={() => fileInputRef.current?.click()}
        fileButtonLabel={fileInputLabel}
        showAttachmentIcon={Boolean(onFilesSelected)}
      />
      {attachmentContent}
      <div className="relative">
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-sm max-w-none px-3 py-3 text-sm focus:outline-none [&_.ProseMirror]:min-h-36 [&_.ProseMirror]:h-full [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            editorClassName,
          )}
        />
        {mentions.mention.active && mentions.filteredMentions.length > 0 && (
          <EditorMentionDropdown
            items={mentions.filteredMentions}
            activeIndex={mentions.mention.index}
            position={mentions.mention.position}
            onSelect={mentions.insertMention}
            onHover={(index) => mentions.setMention((previous) => ({ ...previous, index }))}
          />
        )}
      </div>
      {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
