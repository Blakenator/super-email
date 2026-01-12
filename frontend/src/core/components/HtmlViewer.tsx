import { useMemo } from 'react';
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
 * Sanitize HTML to remove potentially dangerous content
 */
function sanitizeHtml(html: string): string {
  // Create a temporary element to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove script tags
  const scripts = temp.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  // Remove event handlers from all elements
  const allElements = temp.querySelectorAll('*');
  allElements.forEach((el) => {
    // Get all attributes
    const attrs = Array.from(el.attributes);
    attrs.forEach((attr) => {
      // Remove event handlers
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      // Remove javascript: URLs
      if (attr.value.includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Remove iframe tags (can be enabled if needed with sandboxing)
  const iframes = temp.querySelectorAll('iframe');
  iframes.forEach((iframe) => iframe.remove());

  // Remove object and embed tags
  const objects = temp.querySelectorAll('object, embed');
  objects.forEach((obj) => obj.remove());

  // Remove form elements that could submit data
  const forms = temp.querySelectorAll('form');
  forms.forEach((form) => {
    // Keep the content but remove form functionality
    const div = document.createElement('div');
    div.innerHTML = form.innerHTML;
    form.replaceWith(div);
  });

  return temp.innerHTML;
}

/**
 * Safe HTML viewer component
 * Sanitizes HTML before rendering to prevent XSS attacks
 */
export function HtmlViewer({ html, className }: HtmlViewerProps) {
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);

  return (
    <ViewerContainer
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
