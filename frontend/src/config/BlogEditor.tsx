import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';
import { extensions } from '../config/tiptapExtensions';
import './BlogEditor.css';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({
  content,
  onChange,
  editable = true,
}) => {
  const editor = useEditor({
    extensions,
    content: content || '<p>Write your story...</p>',
    editable,
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

  if (!editor) {
    return (
      <div className="mt-1">
        <div className="border border-amber-200 rounded-lg p-8 bg-white text-center">
          <div className="animate-pulse text-neutral-400">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-editor-container mt-1">
      <div className="blog-editor-wrapper border border-amber-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all duration-200">
        <EditorToolbar editor={editor} />
        <div className="blog-editor-content">
          <EditorContent
            editor={editor}
            className="blog-editor-field min-h-[400px] px-4 py-3 focus:outline-none text-neutral-900 font-serif"
          />
        </div>
      </div>
    </div>
  );
};