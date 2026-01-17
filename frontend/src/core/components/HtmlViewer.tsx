import { useMemo, useRef, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faCircle } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../contexts/ThemeContext';
import {
  IframeContainer,
  ThemeToggleButton,
  BackgroundDetectedBadge,
} from './HtmlViewer.wrappers';

interface HtmlViewerProps {
  html: string;
  className?: string;
}

/**
 * Safe HTML viewer using both DOMPurify sanitization AND iframe sandboxing
 *
 * Security benefits of iframe approach:
 * 1. Origin isolation - iframe content cannot access parent DOM, cookies, or JS context
 * 2. Defense in depth - even if sanitization misses something, sandbox blocks execution
 * 3. Style isolation - email CSS cannot affect the parent application
 * 4. Navigation control - links in sandboxed iframe can be controlled
 * 5. Prevents CSS-based attacks (data exfiltration via CSS selectors)
 */
export function HtmlViewer({ html, className }: HtmlViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(200);
  const { isDarkMode } = useTheme();
  const [emailDarkMode, setEmailDarkMode] = useState<boolean | null>(null);

  // Detect if the email has explicit background colors
  const detectedBackground = useMemo(() => {
    const htmlLower = html.toLowerCase();

    // Use regex to match light background patterns
    const lightBgPatterns = [
      /background-color\s*:\s*(#fff|#ffffff|white)/i,
      /background\s*:\s*(#fff|#ffffff|white)/i,
      /bgcolor\s*=\s*["'](#fff|#ffffff|white)["']/i,
    ];

    // Use regex to match dark background patterns
    const darkBgPatterns = [
      /background-color\s*:\s*(#000|#1a1a1a|#2d2d2d|black)/i,
      /background\s*:\s*(#000|#1a1a1a|#2d2d2d|black)/i,
      /bgcolor\s*=\s*["'](#000|#1a1a1a|#2d2d2d|black)["']/i,
    ];

    const hasLightBackground = lightBgPatterns.some((pattern) =>
      pattern.test(htmlLower),
    );
    const hasDarkBackground = darkBgPatterns.some((pattern) =>
      pattern.test(htmlLower),
    );

    if (hasLightBackground && !hasDarkBackground) {
      return 'light';
    }
    if (hasDarkBackground && !hasLightBackground) {
      return 'dark';
    }
    return null;
  }, [html]);

  // Initialize emailDarkMode based on detected background (only on first render)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (
      !hasInitialized.current &&
      detectedBackground &&
      emailDarkMode === null
    ) {
      hasInitialized.current = true;
      setEmailDarkMode(detectedBackground === 'dark');
    }
  }, [detectedBackground, emailDarkMode]);

  // Use page dark mode as default, but allow override
  const effectiveDarkMode = emailDarkMode !== null ? emailDarkMode : isDarkMode;

  // Check if current scheme matches auto-detected scheme
  const matchesAutoDetect =
    detectedBackground &&
    ((detectedBackground === 'dark' && effectiveDarkMode) ||
      (detectedBackground === 'light' && !effectiveDarkMode));

  const sanitizedHtml = useMemo(() => {
    // Configure DOMPurify for email viewing
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'a',
        'abbr',
        'address',
        'article',
        'aside',
        'b',
        'bdi',
        'bdo',
        'blockquote',
        'br',
        'caption',
        'cite',
        'code',
        'col',
        'colgroup',
        'data',
        'dd',
        'del',
        'details',
        'dfn',
        'div',
        'dl',
        'dt',
        'em',
        'figcaption',
        'figure',
        'footer',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'header',
        'hgroup',
        'hr',
        'i',
        'img',
        'ins',
        'kbd',
        'li',
        'main',
        'mark',
        'nav',
        'ol',
        'p',
        'pre',
        'q',
        'rp',
        'rt',
        'ruby',
        's',
        'samp',
        'section',
        'small',
        'span',
        'strong',
        'sub',
        'summary',
        'sup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'time',
        'tr',
        'u',
        'ul',
        'var',
        'wbr',
        'center',
        'font',
      ],
      ALLOWED_ATTR: [
        'href',
        'src',
        'alt',
        'title',
        'class',
        'id',
        'name',
        'width',
        'height',
        'style',
        'target',
        'rel',
        'colspan',
        'rowspan',
        'scope',
        'border',
        'cellpadding',
        'cellspacing',
        'align',
        'valign',
        'bgcolor',
        'color',
        'face',
        'size',
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
      FORBID_TAGS: [
        'script',
        'object',
        'embed',
        'form',
        'input',
        'button',
        'textarea',
        'select',
      ],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }, [html]);

  // Build the complete HTML document for the iframe
  const iframeContent = useMemo(() => {
    const textColor = effectiveDarkMode ? '#e8eaed' : '#202124';
    const linkColor = effectiveDarkMode ? '#8ab4f8' : '#1a73e8';
    const mutedColor = effectiveDarkMode ? '#9aa0a6' : '#5f6368';
    const borderColor = effectiveDarkMode ? '#5f6368' : '#dadce0';
    const codeBgColor = effectiveDarkMode ? '#2d2d2d' : '#f6f8fa';
    const codeTextColor = effectiveDarkMode ? '#e8eaed' : '#24292e';

    // Use transparent background when scheme matches app theme, otherwise explicit color
    const colorSchemeMatchesApp = effectiveDarkMode === isDarkMode;
    const bgColor = colorSchemeMatchesApp
      ? 'transparent'
      : effectiveDarkMode
        ? '#1a1a1a'
        : '#ffffff';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="${effectiveDarkMode ? 'dark' : 'light'}">
  <base target="_blank">
  <style>
    * {
      box-sizing: border-box;
    }
    html {
      color-scheme: ${effectiveDarkMode ? 'dark' : 'light'};
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      background-color: ${bgColor};
      color: ${textColor};
      overflow-x: hidden;
      overflow-y: auto;
    }
    a {
      color: ${linkColor};
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
    }
    td, th {
      border-color: ${borderColor};
    }
    p {
      margin: 0 0 1em 0;
      padding: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    blockquote {
      margin: 0.5em 0 0.5em 0;
      padding: 0.5em 0 0.5em 1em;
      border-left: 3px solid ${mutedColor};
      color: ${mutedColor};
      background-color: ${effectiveDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
    }
    hr {
      border: none;
      border-top: 1px solid ${borderColor};
      margin: 1em 0;
    }
    /* Code block styles for rich text emails */
    pre {
      background-color: ${codeBgColor};
      color: ${codeTextColor};
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 13px;
      line-height: 1.45;
      margin: 0.5em 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    code {
      background-color: ${codeBgColor};
      color: ${codeTextColor};
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 85%;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      font-size: inherit;
    }
    /* List styles with proper indentation */
    ul, ol {
      margin: 0.5em 0;
      padding-left: 2em;
    }
    li {
      margin: 0.25em 0;
    }
    ul ul, ul ol, ol ul, ol ol {
      margin: 0.25em 0;
    }
    /* Nested list indentation */
    li > ul, li > ol {
      margin-top: 0.25em;
    }
  </style>
</head>
<body>${sanitizedHtml}</body>
</html>`;
  }, [sanitizedHtml, effectiveDarkMode, isDarkMode]);

  // Create blob URL for the iframe
  const blobUrl = useMemo(() => {
    const blob = new Blob([iframeContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [iframeContent]);

  // Clean up blob URL when component unmounts or content changes
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Set iframe height to match container max-height so it can scroll internally
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Calculate max height based on viewport (matching HtmlBodyContainer max-height)
      const maxHeight = window.innerHeight - 300;
      // Set iframe to fixed height so it scrolls internally
      setIframeHeight(Math.max(100, maxHeight));
    };

    // Also recalculate on window resize
    const handleResize = () => {
      const maxHeight = window.innerHeight - 300;
      setIframeHeight(Math.max(100, maxHeight));
    };

    iframe.addEventListener('load', handleLoad);
    window.addEventListener('resize', handleResize);

    // Set initial height
    const maxHeight = window.innerHeight - 300;
    setIframeHeight(Math.max(100, maxHeight));

    return () => {
      iframe.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleResize);
    };
  }, [blobUrl]);

  return (
    <IframeContainer className={className}>
      <ThemeToggleButton
        variant="outline-secondary"
        size="sm"
        onClick={() =>
          setEmailDarkMode((prev) => (prev === null ? !isDarkMode : !prev))
        }
        title={
          matchesAutoDetect
            ? `${effectiveDarkMode ? 'Light' : 'Dark'} mode (auto-detected from email)`
            : effectiveDarkMode
              ? 'Switch to light mode'
              : 'Switch to dark mode'
        }
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <FontAwesomeIcon icon={effectiveDarkMode ? faMoon : faSun} />
          {matchesAutoDetect && (
            <BackgroundDetectedBadge>
              <FontAwesomeIcon icon={faCircle} />
            </BackgroundDetectedBadge>
          )}
        </span>
      </ThemeToggleButton>
      <iframe
        ref={iframeRef}
        src={blobUrl}
        title="Email content"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        scrolling="yes"
        // @ts-expect-error - allowtransparency is a valid HTML attribute but not typed in React
        allowtransparency="true"
        style={{
          width: '100%',
          height: `${iframeHeight}px`,
          border: 'none',
          display: 'block',
          backgroundColor: 'transparent',
          colorScheme: effectiveDarkMode ? 'dark' : 'light',
        }}
      />
    </IframeContainer>
  );
}
