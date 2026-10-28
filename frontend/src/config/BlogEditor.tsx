import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';
import { extensions } from '../config/tiptapExtensions';
import './BlogEditor.css';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  /** Rendered between the sticky toolbar and the writing surface (e.g. title + tags). */
  children?: React.ReactNode;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({
  content,
  onChange,
  editable = true,
  children,
}) => {
  const editor = useEditor({
    extensions,
    content: content || '<p>Write your story...</p>',
    editable,
    editorProps: {
      attributes: {
        class: 'prose min-h-[50vh] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
  });

  useEffect(() => {
    if (editor && content) {
      try {
        const parsedContent = JSON.parse(content);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(parsedContent)) {
          editor.commands.setContent(parsedContent);
        }
      } catch {
        // If content is not valid JSON, set as HTML
        editor.commands.setContent(content || '<p>Write your story...</p>');
      }
    }
  }, [content, editor]);

  return (
    <div className="blog-editor-container">
      {/* Sticky formatting toolbar, full width under the editor top bar */}
      <div className="sticky top-16 z-20 bg-surface border-b border-line">
        {editor ? (
          <EditorToolbar editor={editor} />
        ) : (
          <div className="h-12" aria-hidden />
        )}
      </div>

      <div className="max-w-[720px] mx-auto px-5 md:px-0 py-10 md:py-14">
        {children}

        {editor ? (
          <EditorContent editor={editor} className="blog-editor-field mt-8" />
        ) : (
          <div className="mt-8 min-h-[400px] font-mono text-xs text-muted animate-pulse">Loading editor...</div>
        )}
      </div>
    </div>
  );
};
