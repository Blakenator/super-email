import { useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { TRANSFORMERS } from '@lexical/markdown';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faListUl,
  faListOl,
  faQuoteRight,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import { FORMAT_TEXT_COMMAND, $getSelection, $isRangeSelection } from 'lexical';

const EditorContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
`;

const ToolbarButton = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
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

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.colors.primaryDark : props.theme.colors.backgroundHover};
  }
`;

const EditorContent = styled.div`
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
`;

const ContentEditableWrapper = styled.div`
  position: relative;
`;

// Toolbar component with formatting buttons
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }, [editor]);

  const formatUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }, [editor]);

  return (
    <Toolbar>
      <ToolbarButton onClick={formatBold} title="Bold (Ctrl+B)">
        <FontAwesomeIcon icon={faBold} />
      </ToolbarButton>
      <ToolbarButton onClick={formatItalic} title="Italic (Ctrl+I)">
        <FontAwesomeIcon icon={faItalic} />
      </ToolbarButton>
      <ToolbarButton onClick={formatUnderline} title="Underline (Ctrl+U)">
        <FontAwesomeIcon icon={faUnderline} />
      </ToolbarButton>
    </Toolbar>
  );
}

// Plugin to set initial HTML content
function InitialContentPlugin({
  initialHtml,
}: {
  initialHtml?: string;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialHtml) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
    }
  }, [editor, initialHtml]);

  return null;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  initialHtml?: string;
  autoFocus?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your message...',
  initialHtml,
  autoFocus = false,
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'EmailEditor',
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'font-italic',
        underline: 'underline',
      },
    },
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
      console.error('Lexical error:', error);
    },
  };

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);
        const text = $getRoot().getTextContent();
        onChange?.(html, text);
      });
    },
    [onChange],
  );

  return (
    <EditorContainer>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <EditorContent>
          <ContentEditableWrapper>
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={
                <div className="editor-placeholder">{placeholder}</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </ContentEditableWrapper>
        </EditorContent>
        <HistoryPlugin />
        <LinkPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} />
        {autoFocus && <AutoFocusPlugin />}
        {initialHtml && <InitialContentPlugin initialHtml={initialHtml} />}
      </LexicalComposer>
    </EditorContainer>
  );
}
