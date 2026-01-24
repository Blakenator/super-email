/**
 * Shared Email HTML CSS Styles
 * Used by both web and mobile apps for consistent email rendering
 */

export interface EmailHtmlStyleOptions {
  isDarkMode: boolean;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  borderColor: string;
  mutedColor: string;
  codeBgColor?: string;
  codeTextColor?: string;
}

/**
 * Generate CSS for email HTML rendering
 * This ensures consistent rendering across web and mobile
 */
export function getEmailHtmlCss(options: EmailHtmlStyleOptions): string {
  const {
    isDarkMode,
    backgroundColor,
    textColor,
    linkColor,
    borderColor,
    mutedColor,
    codeBgColor = isDarkMode ? '#2d2d2d' : '#f5f5f5',
    codeTextColor = textColor,
  } = options;

  return `
    * {
      box-sizing: border-box;
    }
    html {
      color-scheme: ${isDarkMode ? 'dark' : 'light'};
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      background-color: ${backgroundColor};
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
    /* Tables - no default borders/padding to match email client behavior */
    table {
      border-collapse: collapse;
      border-spacing: 0;
      margin: 0;
      padding: 0;
    }
    td, th {
      /* Let inline styles control borders/padding */
      padding: 0;
      margin: 0;
      vertical-align: top;
    }
    /* Paragraphs */
    p {
      margin: 0 0 1em 0;
      padding: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    /* Blockquotes - for quoted emails */
    blockquote {
      margin: 0.5em 0 0.5em 0;
      padding: 0.5em 0 0.5em 1em;
      border-left: 3px solid ${mutedColor};
      color: ${mutedColor};
      background-color: ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
    }
    /* HR */
    hr {
      border: none;
      border-top: 1px solid ${borderColor};
      margin: 1em 0;
    }
    /* Code blocks */
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
    /* Lists */
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
    li > ul, li > ol {
      margin-top: 0.25em;
    }
    /* Headers */
    h1, h2, h3, h4, h5, h6 {
      margin: 0.5em 0 0.25em;
      padding: 0;
    }
    /* Divs should not add spacing */
    div {
      margin: 0;
      padding: 0;
    }
    /* Center and font tags (legacy email HTML) */
    center {
      text-align: center;
    }
  `;
}

/**
 * Generate HTML wrapper for email content
 */
export function wrapEmailHtml(
  content: string,
  options: EmailHtmlStyleOptions,
): string {
  const css = getEmailHtmlCss(options);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="${options.isDarkMode ? 'dark' : 'light'}">
  <base target="_blank">
  <style>${css}</style>
</head>
<body>${content}</body>
</html>
  `.trim();
}

/**
 * Generate blockquote wrapper for reply content
 */
export function wrapReplyContent(
  originalHtml: string,
  fromEmail: string,
  date: Date = new Date(),
): string {
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return `
<br/><br/>
<div class="gmail_quote">
  <div class="gmail_attr" style="color: #666; font-size: 12px; margin-bottom: 8px;">
    On ${formattedDate}, &lt;${fromEmail}&gt; wrote:
  </div>
  <blockquote style="margin: 0; padding: 0 0 0 12px; border-left: 3px solid #ccc; color: #666;">
${originalHtml}
  </blockquote>
</div>
  `.trim();
}
