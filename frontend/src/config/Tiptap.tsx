import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

export default function Tiptap() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),


      Underline,

      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],

    editorProps: {
      attributes: {
        class:
          "min-h-[500px] rounded-xl border border-neutral-300 bg-white px-5 py-4 outline-none prose prose-neutral max-w-none",
      },
    },

    content: "",
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}