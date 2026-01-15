import styled from 'styled-components';
import { Button } from 'react-bootstrap';

export const IframeContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow: hidden;
  position: relative;
`;

export const ThemeToggleButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

export const BackgroundDetectedBadge = styled.span`
  position: absolute;
  top: 0px;
  right: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.success};
  font-size: 10px;
  pointer-events: none;
`;

export const ViewerContainer = styled.div`
  /* Reset to match typical email HTML defaults */
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: 14px;

  /* Paragraphs - minimal margins like email clients */
  p {
    margin: 0;
    padding: 0;
  }

  /* Only add space between consecutive paragraphs */
  p + p {
    margin-top: 0.5em;
  }

  /* Headers */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0.5em 0 0.25em;
    padding: 0;
  }

  /* Lists - tighter spacing */
  ul,
  ol {
    margin: 0.25em 0;
    padding-left: 1.5em;
  }

  li {
    margin: 0;
    padding: 0;
  }

  /* Blockquotes */
  blockquote {
    margin: 0.5em 0;
    padding-left: 0.75em;
    border-left: 2px solid ${({ theme }) => theme.colors.textMuted};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  /* Links */
  a {
    color: ${({ theme }) => theme.colors.primary};
  }

  /* Code */
  code {
    background: ${({ theme }) => theme.colors.background};
    padding: 0.125em 0.25em;
    border-radius: 2px;
    font-family: monospace;
    font-size: 0.9em;
  }

  pre {
    background: ${({ theme }) => theme.colors.background};
    padding: 0.75em;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5em 0;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Tables - match email HTML defaults (no borders unless specified) */
  table {
    border-collapse: collapse;
    border-spacing: 0;
    margin: 0;
    padding: 0;
    /* Don't force borders - let inline styles control this */
  }

  td,
  th {
    /* Don't add default padding or borders - let inline styles handle it */
    padding: 0;
    margin: 0;
    vertical-align: top;
  }

  /* Divs should not add spacing */
  div {
    margin: 0;
    padding: 0;
  }

  /* BR elements */
  br {
    line-height: inherit;
  }

  /* HR */
  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    margin: 0.5em 0;
  }

  /* Center and font tags (legacy email HTML) */
  center {
    text-align: center;
  }

  font {
    /* Let inline styles handle font tags */
  }

  /* Spacing utility - common in email HTML */
  .spacer,
  [class*='spacer'] {
    display: block;
  }
`;
