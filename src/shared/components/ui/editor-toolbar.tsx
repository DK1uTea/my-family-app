'use client';

import type { Editor as TiptapEditor } from '@tiptap/react';
import {
  BoldIcon, UnderlineIcon, ItalicIcon, StrikethroughIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
  ChevronDownIcon, ImageIcon,
  PaperclipIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

type ToolbarButtonProps = {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  testId?: string;
};

function ToolbarButton({ active, onClick, children, disabled, ariaLabel, testId }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  );
}

function getHeadingLabel(editor: TiptapEditor | null) {
  if (editor?.isActive('heading', { level: 1 })) return 'Heading 1';
  if (editor?.isActive('heading', { level: 2 })) return 'Heading 2';
  if (editor?.isActive('heading', { level: 3 })) return 'Heading 3';
  return 'Paragraph';
}

type Props = {
  editor: TiptapEditor | null;
  disabled?: boolean;
  showHeadings?: boolean;
  onImageButtonClick?: () => void;
  fileButtonLabel?: string;
  showAttachmentIcon?: boolean;
};

export function EditorToolbar({ editor, disabled, showHeadings, onImageButtonClick, fileButtonLabel, showAttachmentIcon }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
      {showHeadings && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                data-testid="cam-editor-paragraph-menu"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                {getHeadingLabel(editor)}
                <ChevronDownIcon className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem data-testid="cam-editor-paragraph" onClick={() => editor?.chain().focus().setParagraph().run()}>Paragraph</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mx-1 w-px self-stretch bg-border" />
        </>
      )}
      <ToolbarButton testId="cam-editor-bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} disabled={disabled}>
        <BoldIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton testId="cam-editor-underline" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} disabled={disabled}>
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton testId="cam-editor-italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={disabled}>
        <ItalicIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton testId="cam-editor-strike" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} disabled={disabled}>
        <StrikethroughIcon className="size-3.5" />
      </ToolbarButton>
      {onImageButtonClick && (
        <>
          <div className="mx-1 w-px self-stretch bg-border" />
          <ToolbarButton onClick={onImageButtonClick} disabled={disabled} ariaLabel={fileButtonLabel}>
            {showAttachmentIcon ? <PaperclipIcon className="size-3.5" /> : <ImageIcon className="size-3.5" />}
          </ToolbarButton>
        </>
      )}
      <div className="mx-1 w-px self-stretch bg-border" />
      <ToolbarButton testId="cam-editor-align-left" active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()} disabled={disabled}>
        <AlignLeftIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton testId="cam-editor-align-center" active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()} disabled={disabled}>
        <AlignCenterIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton testId="cam-editor-align-right" active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()} disabled={disabled}>
        <AlignRightIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton testId="cam-editor-align-justify" active={editor?.isActive({ textAlign: 'justify' })} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} disabled={disabled}>
        <AlignJustifyIcon className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}
