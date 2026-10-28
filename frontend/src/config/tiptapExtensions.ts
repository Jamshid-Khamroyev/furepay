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
    return ['hr', { ...HTMLAttributes }];
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
        class: 'font-mono',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: '',
      },
    },
    horizontalRule: false,
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'underline underline-offset-2',
    },
  }),
  Placeholder.configure({
    placeholder: 'Write your story...',
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
  }),
  HorizontalRule,
];