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

  blockquote {
    margin: 0.5rem 0;
    padding: 0.5rem 1rem;
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
  }

  code {
    background: ${({ theme }) => theme.colors.background};
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
  }

  pre {
    background: #282c34;
    color: #abb2bf;
    padding: 1rem;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    overflow-x: auto;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
    margin: 0.5rem 0;
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
