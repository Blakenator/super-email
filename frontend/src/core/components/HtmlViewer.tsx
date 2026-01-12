import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  line-height: 1.7;
  word-wrap: break-word;
  overflow-wrap: break-word;

  p {
    margin: 0 0 0.75rem;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 1rem 0 0.5rem;
  }

  ul, ol {
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

  pre {
    background: ${({ theme }) => theme.colors.background};
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  table {
    max-width: 100%;
    border-collapse: collapse;
    margin: 0.5rem 0;
  }

  td, th {
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin: 1rem 0;
  }
`;

interface HtmlViewerProps {
  html: string;
  className?: string;
}

/**
 * Safe HTML viewer using DOMPurify for sanitization
 * Renders HTML content safely by removing XSS vectors
 */
export function HtmlViewer({ html, className }: HtmlViewerProps) {
  const sanitizedHtml = useMemo(() => {
    // Configure DOMPurify for email viewing
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'a', 'abbr', 'address', 'article', 'aside', 'b', 'bdi', 'bdo',
        'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup',
        'data', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em',
        'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'header', 'hgroup', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'main',
        'mark', 'nav', 'ol', 'p', 'pre', 'q', 'rp', 'rt', 'ruby', 's',
        'samp', 'section', 'small', 'span', 'strong', 'sub', 'summary',
        'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time',
        'tr', 'u', 'ul', 'var', 'wbr', 'center', 'font',
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id', 'name', 'width', 'height',
        'style', 'target', 'rel', 'colspan', 'rowspan', 'scope', 'border',
        'cellpadding', 'cellspacing', 'align', 'valign', 'bgcolor', 'color',
        'face', 'size',
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }, [html]);

  return (
    <ViewerContainer
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
