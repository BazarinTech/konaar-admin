'use client';

import * as React from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Heading2Icon,
  RedoIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The editor for replies and bulk email.
 *
 * TipTap rather than a textarea: an email is formatted text, and asking an
 * operator to write HTML by hand is how a broken tag reaches ten thousand
 * inboxes. Its output is a small, predictable set of tags, which is exactly
 * what mail clients render consistently.
 */
export function RichEditor({
  value,
  onChange,
  placeholder = 'Write your message…',
  minHeight = 160,
  autoFocus = false,
  onSubmitShortcut,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
  /** ⌘/Ctrl + Enter. */
  onSubmitShortcut?: () => void;
}) {
  const submit = React.useRef(onSubmitShortcut);
  React.useEffect(() => {
    submit.current = onSubmitShortcut;
  }, [onSubmitShortcut]);

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose-email max-w-none px-3 py-2.5 text-sm leading-relaxed outline-none',
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          submit.current?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // A parent that clears the form after sending clears the editor too.
  React.useEffect(() => {
    if (editor && value === '' && !editor.isEmpty) editor.commands.clearContent();
  }, [editor, value]);

  return (
    <div className="bg-background focus-within:ring-ring/40 rounded-md border focus-within:ring-2">
      <Toolbar editor={editor} />
      <div style={{ minHeight }} className="cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            heading: e.isActive('heading', { level: 2 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });
  if (!editor || !state) {
    return <div className="h-9 border-b" />;
  }
  const chain = () => editor.chain().focus();

  const setLink = () => {
    if (state.link) {
      chain().unsetLink().run();
      return;
    }
    const url = window.prompt('Link address');
    if (!url) return;
    chain().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
      <Tool label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <BoldIcon />
      </Tool>
      <Tool label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <ItalicIcon />
      </Tool>
      <Tool label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <UnderlineIcon />
      </Tool>
      <Tool label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <StrikethroughIcon />
      </Tool>
      <Divider />
      <Tool label="Heading" active={state.heading} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2Icon />
      </Tool>
      <Tool label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <ListIcon />
      </Tool>
      <Tool label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrderedIcon />
      </Tool>
      <Tool label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <QuoteIcon />
      </Tool>
      <Tool label={state.link ? 'Remove link' : 'Link'} active={state.link} onClick={setLink}>
        <LinkIcon />
      </Tool>
      <div className="ml-auto flex items-center gap-0.5">
        <Tool label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <UndoIcon />
        </Tool>
        <Tool label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <RedoIcon />
        </Tool>
      </div>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-7 items-center justify-center rounded transition-colors disabled:opacity-40 [&_svg]:size-3.5',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="bg-border mx-1 h-4 w-px" />;
}
