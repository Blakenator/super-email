import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { ViewerContainer } from './HtmlViewer.wrappers';

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
