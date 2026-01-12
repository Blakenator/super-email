import { useCallback, useEffect, useState } from 'react';
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
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  TRANSFORMERS,
  type TextMatchTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  ELEMENT_TRANSFORMERS,
} from '@lexical/markdown';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  type EditorState,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faListUl,
  faListOl,
  faQuoteRight,
  faLink,
  faCode,
  faIndent,
  faOutdent,
  faTable,
  faPalette,
  faTextHeight,
  faFont,
} from '@fortawesome/free-solid-svg-icons';
import { Dropdown, DropdownButton, Form } from 'react-bootstrap';

const EditorContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  overflow: hidden;
`;

const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  align-items: center;
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0 ${({ theme }) => theme.spacing.xs};
`;

// Using a wrapper to ensure type="button" is always set
const ToolbarButtonBase = styled.button.attrs({ type: 'button' })<{
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

const ToolbarButton = ToolbarButtonBase;

const ToolbarSelect = styled.select`
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

const ColorInput = styled.input`
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

const ContentEditableWrapper = styled.div`
  position: relative;
`;

const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
];

const FONT_SIZES = [
  { value: '10px', label: '10' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
];

// Enhanced Toolbar with all formatting options
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(
    new Set(),
  );
  const [fontColor, setFontColor] = useState('#000000');
  const [fontSize, setFontSize] = useState('14px');
  const [fontFamily, setFontFamily] = useState('inherit');

  // Update active formats on selection change
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const formats = new Set<TextFormatType>();
          if (selection.hasFormat('bold')) formats.add('bold');
          if (selection.hasFormat('italic')) formats.add('italic');
          if (selection.hasFormat('underline')) formats.add('underline');
          if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
          if (selection.hasFormat('code')) formats.add('code');
          setActiveFormats(formats);
        }
      });
    });
  }, [editor]);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor],
  );

  const insertList = useCallback(
    (type: 'bullet' | 'number') => {
      if (type === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }
    },
    [editor],
  );

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  const formatCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  }, [editor]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  }, [editor]);

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }, [editor]);

  const indent = useCallback(() => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  const outdent = useCallback(() => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  const applyFontColor = useCallback(
    (color: string) => {
      setFontColor(color);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            if (node.getType() === 'text') {
              const textNode = node as any;
              textNode.setStyle(`color: ${color}`);
            }
          });
        }
      });
    },
    [editor],
  );

  const applyFontSize = useCallback(
    (size: string) => {
      setFontSize(size);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            if (node.getType() === 'text') {
              const textNode = node as any;
              textNode.setStyle(`font-size: ${size}`);
            }
          });
        }
      });
    },
    [editor],
  );

  const applyFontFamily = useCallback(
    (family: string) => {
      setFontFamily(family);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            if (node.getType() === 'text') {
              const textNode = node as any;
              textNode.setStyle(`font-family: ${family}`);
            }
          });
        }
      });
    },
    [editor],
  );

  return (
    <ToolbarRow>
      {/* Font Family */}
      <ToolbarSelect
        value={fontFamily}
        onChange={(e) => applyFontFamily(e.target.value)}
        title="Font Family"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </ToolbarSelect>

      {/* Font Size */}
      <ToolbarSelect
        value={fontSize}
        onChange={(e) => applyFontSize(e.target.value)}
        title="Font Size"
      >
        {FONT_SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </ToolbarSelect>

      <ToolbarDivider />

      {/* Basic Formatting */}
      <ToolbarButton
        onClick={() => formatText('bold')}
        $active={activeFormats.has('bold')}
        title="Bold (Ctrl+B)"
      >
        <FontAwesomeIcon icon={faBold} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('italic')}
        $active={activeFormats.has('italic')}
        title="Italic (Ctrl+I)"
      >
        <FontAwesomeIcon icon={faItalic} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('underline')}
        $active={activeFormats.has('underline')}
        title="Underline (Ctrl+U)"
      >
        <FontAwesomeIcon icon={faUnderline} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('strikethrough')}
        $active={activeFormats.has('strikethrough')}
        title="Strikethrough"
      >
        <FontAwesomeIcon icon={faStrikethrough} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Font Color */}
      <ColorInput
        type="color"
        value={fontColor}
        onChange={(e) => applyFontColor(e.target.value)}
        title="Font Color"
      />

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => insertList('bullet')}
        title="Bullet List"
      >
        <FontAwesomeIcon icon={faListUl} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => insertList('number')}
        title="Numbered List"
      >
        <FontAwesomeIcon icon={faListOl} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Indentation */}
      <ToolbarButton onClick={outdent} title="Decrease Indent">
        <FontAwesomeIcon icon={faOutdent} />
      </ToolbarButton>
      <ToolbarButton onClick={indent} title="Increase Indent">
        <FontAwesomeIcon icon={faIndent} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block Formatting */}
      <ToolbarButton onClick={formatQuote} title="Block Quote">
        <FontAwesomeIcon icon={faQuoteRight} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('code')}
        $active={activeFormats.has('code')}
        title="Inline Code"
      >
        <FontAwesomeIcon icon={faCode} />
      </ToolbarButton>
      <ToolbarButton onClick={formatCodeBlock} title="Code Block">
        {'</>'}
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton onClick={insertLink} title="Insert Link (Ctrl+K)">
        <FontAwesomeIcon icon={faLink} />
      </ToolbarButton>
    </ToolbarRow>
  );
}

// Strikethrough transformer for tilde syntax (~text~)
const STRIKETHROUGH_TRANSFORMER: TextMatchTransformer = {
  dependencies: [],
  export: (node) => {
    if (node.hasFormat && node.hasFormat('strikethrough')) {
      return `~${node.getTextContent()}~`;
    }
    return null;
  },
  importRegExp: /~([^~]+)~/,
  regExp: /~([^~]+)~$/,
  replace: (textNode, match) => {
    const newNode = $createTextNode(match[1]);
    newNode.toggleFormat('strikethrough');
    textNode.replace(newNode);
  },
  trigger: '~',
  type: 'text-match',
};

// Custom transformers including strikethrough
const CUSTOM_TRANSFORMERS = [
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
  ...ELEMENT_TRANSFORMERS,
  STRIKETHROUGH_TRANSFORMER,
];

// Keyboard shortcuts plugin
function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Handle Tab for indentation
    const removeTabListener = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        event.preventDefault();
        if (event.shiftKey) {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    // Handle keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;

      // Strikethrough: Cmd+Shift+X
      if (isMeta && event.shiftKey && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        return;
      }

      // Bold: Cmd+B (Lexical should handle this, but ensure it works)
      if (isMeta && !event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        return;
      }

      // Italic: Cmd+I
      if (isMeta && !event.shiftKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        return;
      }

      // Underline: Cmd+U
      if (isMeta && !event.shiftKey && event.key.toLowerCase() === 'u') {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        return;
      }
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      removeTabListener();
      if (rootElement) {
        rootElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [editor]);

  return null;
}

// Plugin to set initial HTML content
function InitialContentPlugin({ initialHtml }: { initialHtml?: string }) {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialHtml && !initialized) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        if (nodes.length > 0) {
          root.append(...nodes);
        }
      });
      setInitialized(true);
    }
  }, [editor, initialHtml, initialized]);

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
        strikethrough: 'line-through',
        code: 'editor-code',
      },
      quote: 'editor-quote',
      code: 'editor-code-block',
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
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
        <TablePlugin />
        <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
        <KeyboardShortcutsPlugin />
        <OnChangePlugin onChange={handleChange} />
        {autoFocus && <AutoFocusPlugin />}
        {initialHtml && <InitialContentPlugin initialHtml={initialHtml} />}
      </LexicalComposer>
    </EditorContainer>
  );
}
