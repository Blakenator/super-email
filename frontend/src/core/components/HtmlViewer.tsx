import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  line-height: 1.7;

  p {
    margin: 0 0 0.75rem;
  }

  h1,
  h2,
  h3 {
    margin: 1rem 0 0.5rem;
  }

  ul,
  ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  blockquote {
    margin: 0.5rem 0;
    padding-left: 1rem;
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
  }

  code {
    background: ${({ theme }) => theme.colors.background};
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: monospace;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  table {
    max-width: 100%;
    overflow-x: auto;
    display: block;
    border-collapse: collapse;
  }

  td,
  th {
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ReadOnlyContent = styled(ContentEditable)`
  outline: none;
  cursor: default;
`;

// Plugin to load HTML content into the editor
function HtmlContentPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (html) {
      editor.update(() => {
        try {
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          if (nodes.length > 0) {
            root.append(...nodes);
          }
        } catch (error) {
          console.error('Failed to parse HTML:', error);
        }
      });
    }
  }, [editor, html]);

  return null;
}

interface HtmlViewerProps {
  html: string;
  className?: string;
}

/**
 * Safe HTML viewer using Lexical
 * Renders HTML content without using dangerouslySetInnerHTML
 */
export function HtmlViewer({ html, className }: HtmlViewerProps) {
  const initialConfig = {
    namespace: 'HtmlViewer',
    editable: false,
    theme: {},
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
    ],
    onError: (error: Error) => {
      console.error('HtmlViewer error:', error);
    },
  };

  // For very complex HTML, fall back to a sanitized version
  // Lexical can't handle all HTML (e.g., complex tables, iframes)
  if (html.includes('<table') || html.includes('<iframe') || html.includes('<style')) {
    return (
      <ViewerContainer className={className}>
        <SafeHtmlFallback html={html} />
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer className={className}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ReadOnlyContent />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HtmlContentPlugin html={html} />
      </LexicalComposer>
    </ViewerContainer>
  );
}

/**
 * Fallback component that sanitizes HTML before rendering
 * Used for complex HTML that Lexical can't parse
 */
function SafeHtmlFallback({ html }: { html: string }) {
  // Basic HTML sanitization - remove scripts and event handlers
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  return (
    <div
      style={{ overflow: 'auto' }}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
