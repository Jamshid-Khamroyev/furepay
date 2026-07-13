// utils/tiptap.ts
import { JSONContent } from '@tiptap/react';

export function renderTiptapContent(content: JSONContent | string): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (!content || !content.content) {
    return '';
  }

  return content.content.map((node) => renderNode(node)).join('');
}

function renderNode(node: JSONContent): string {
  switch (node.type) {
    case 'paragraph':
      return `<p>${renderChildren(node.content)}</p>`;
    case 'heading':
      const level = node.attrs?.level || 1;
      return `<h${level}>${renderChildren(node.content)}</h${level}>`;
    case 'text':
      let text = node.text || '';
      if (node.marks) {
        node.marks.forEach((mark) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'strike':
              text = `<s>${text}</s>`;
              break;
            case 'link':
              const href = mark.attrs?.href || '#';
              text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
              break;
          }
        });
      }
      return text;
    case 'bulletList':
      return `<ul>${renderChildren(node.content)}</ul>`;
    case 'orderedList':
      return `<ol>${renderChildren(node.content)}</ol>`;
    case 'listItem':
      return `<li>${renderChildren(node.content)}</li>`;
    case 'blockquote':
      return `<blockquote>${renderChildren(node.content)}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${renderChildren(node.content)}</code></pre>`;
    case 'hardBreak':
      return '<br />';
    case 'horizontalRule':
      return '<hr />';
    default:
      return renderChildren(node.content);
  }
}

function renderChildren(children?: JSONContent[]): string {
  if (!children) return '';
  return children.map((child) => renderNode(child)).join('');
}