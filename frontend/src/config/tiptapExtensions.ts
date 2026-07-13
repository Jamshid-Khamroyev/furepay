import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Node } from '@tiptap/core';

const HorizontalRule = Node.create({
  name: 'horizontalRule',
  group: 'block',
  parseHTML() {
    return [{ tag: 'hr' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['hr', { ...HTMLAttributes, class: 'my-4 border-amber-200' }];
  },
  addCommands() {
    return {
      setHorizontalRule: () => ({ chain }) => {
        return chain().insertContent({ type: this.name }).run();
      },
    };
  },
});

export const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'bg-neutral-50 p-4 rounded-md font-mono text-sm',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-amber-300 pl-4 italic text-neutral-600',
      },
    },
    horizontalRule: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-amber-700 underline underline-offset-2 hover:text-amber-900',
    },
  }),
  Placeholder.configure({
    placeholder: 'Write your story...',
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
  }),
  HorizontalRule,
];