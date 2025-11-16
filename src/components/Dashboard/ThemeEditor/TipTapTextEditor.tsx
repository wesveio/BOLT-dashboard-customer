'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// Note: Link extension can be added later with: yarn add @tiptap/extension-link
import { useCallback, useEffect } from 'react';
import { Card, CardBody } from '@heroui/react';

interface TipTapTextEditorProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function TipTapTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
}: TipTapTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      // Link extension can be added later
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleHeading = useCallback(
    (level: 1 | 2 | 3) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    // Link functionality will be available when @tiptap/extension-link is installed
    alert('Link feature coming soon - install @tiptap/extension-link');
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground/80">{label}</label>
      <Card className="border border-default">
        <CardBody className="p-0">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-default bg-default-50 rounded-t-lg">
            <button
              type="button"
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('bold') ? 'bg-default-300' : ''
              }`}
              title="Bold"
            >
              <span className="font-bold text-sm">B</span>
            </button>
            <button
              type="button"
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('italic') ? 'bg-default-300' : ''
              }`}
              title="Italic"
            >
              <span className="italic text-sm">I</span>
            </button>
            <div className="w-px h-6 bg-default-300 mx-1" />
            <button
              type="button"
              onClick={() => toggleHeading(1)}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-default-300' : ''
              }`}
              title="Heading 1"
            >
              <span className="text-sm font-semibold">H1</span>
            </button>
            <button
              type="button"
              onClick={() => toggleHeading(2)}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-default-300' : ''
              }`}
              title="Heading 2"
            >
              <span className="text-sm font-semibold">H2</span>
            </button>
            <button
              type="button"
              onClick={() => toggleHeading(3)}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-default-300' : ''
              }`}
              title="Heading 3"
            >
              <span className="text-sm font-semibold">H3</span>
            </button>
            <div className="w-px h-6 bg-default-300 mx-1" />
            <button
              type="button"
              onClick={setLink}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('link') ? 'bg-default-300' : ''
              }`}
              title="Add Link"
            >
              <span className="text-sm">🔗</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('bulletList') ? 'bg-default-300' : ''
              }`}
              title="Bullet List"
            >
              <span className="text-sm">• List</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-default-200 ${
                editor.isActive('orderedList') ? 'bg-default-300' : ''
              }`}
              title="Numbered List"
            >
              <span className="text-sm">1. List</span>
            </button>
          </div>

          {/* Editor */}
          <div
            style={{ minHeight }}
            className="prose prose-sm max-w-none p-4 rounded-b-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
          >
            <EditorContent editor={editor} />
            {editor.isEmpty && (
              <div className="text-foreground/40 italic absolute pointer-events-none">{placeholder}</div>
            )}
          </div>
        </CardBody>
      </Card>
      <p className="text-xs text-foreground/60">Use the toolbar above to format your text</p>
    </div>
  );
}

