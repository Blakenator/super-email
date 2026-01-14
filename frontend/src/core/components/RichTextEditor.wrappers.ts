import styled from 'styled-components';

export const EditorContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  overflow: hidden;
`;

export const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  align-items: center;
`;

export const ToolbarDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0 ${({ theme }) => theme.spacing.xs};
`;

export const ToolbarButtonBase = styled.button.attrs({ type: 'button' })<{
  $active?: boolean;
}>`
  padding: 4px 8px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${(props) =>
    props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${(props) =>
    props.$active ? 'white' : props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;

  &:hover {
    background: ${(props) =>
      props.$active
        ? props.theme.colors.primaryDark
        : props.theme.colors.backgroundHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ToolbarButton = ToolbarButtonBase;

export const ToolbarSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  font-size: 0.75rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const ColorInput = styled.input`
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
`;

export const EditorContent = styled.div`
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};

  .editor-input {
    outline: none;
    min-height: 180px;
  }

  .editor-placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
    padding: ${({ theme }) => theme.spacing.md};
  }

  p {
    margin: 0 0 0.5rem;
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

  blockquote,
  .editor-quote {
    margin: 0.5rem 0;
    padding: 0.5rem 1rem;
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
  }

  /* Text formatting classes from Lexical theme
     Using specific class names to avoid conflicts and allow combining */
  .editor-text-bold {
    font-weight: bold !important;
  }

  .editor-text-italic {
    font-style: italic !important;
  }

  .editor-text-underline {
    text-decoration: underline !important;
  }

  .editor-text-strikethrough {
    text-decoration: line-through !important;
  }

  /* Handle multiple text decorations simultaneously */
  .editor-text-underline.editor-text-strikethrough {
    text-decoration: underline line-through !important;
  }

  /* Inline code styling - apply only to the class, not both class and element */
  .editor-text-code {
    background: ${({ theme }) => theme.colors.background};
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 0.85em;
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.danger};
  }

  /* Prevent double styling when code element has editor-text-code class */
  code.editor-text-code {
    /* Reset any default code element styles - the class styles above handle everything */
  }

  /* Fallback for native code element only when NOT styled by editor */
  code:not(.editor-text-code):not(pre code):not([class]) {
    background: ${({ theme }) => theme.colors.background};
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 0.85em;
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.danger};
  }

  /* Code block styling - distinct from inline code */
  pre,
  .editor-code-block {
    display: block;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    overflow-x: auto;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    margin: 0.5rem 0;
    border: 1px solid ${({ theme }) => theme.colors.border};
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
  }

  /* Ensure code inside pre doesn't double-style */
  pre code,
  .editor-code-block code {
    background: transparent;
    padding: 0;
    border: none;
    border-radius: 0;
    color: inherit;
    font-size: inherit;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.5rem 0;
  }

  th,
  td {
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 0.5rem;
    text-align: left;
  }

  th {
    background: ${({ theme }) => theme.colors.background};
    font-weight: 600;
  }

  s {
    text-decoration: line-through;
  }
`;

export const ContentEditableWrapper = styled.div`
  position: relative;
`;
