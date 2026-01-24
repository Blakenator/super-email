/**
 * RichTextEditor component for React Native
 * Uses WebView with contenteditable for rich text editing
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Keyboard,
  Dimensions,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '../../theme';
import { SPACING, RADIUS, FONT_SIZE } from '../../theme/styles';
import { Icon } from './Icon';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  initialHtml?: string;
  minHeight?: number;
  autoFocus?: boolean;
}

// Formatting button type
type FormatAction = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'insertUnorderedList' | 'insertOrderedList' | 'formatBlock';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your message...',
  initialHtml = '',
  minHeight = 200,
  autoFocus = false,
}: RichTextEditorProps) {
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [editorHeight, setEditorHeight] = useState(minHeight);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Listen to keyboard events
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'content') {
        onChange?.(data.html, data.text);
      } else if (data.type === 'height') {
        setEditorHeight(Math.max(minHeight, data.height + 20));
      } else if (data.type === 'format') {
        setActiveFormats(new Set(data.formats));
      }
    } catch (e) {
      console.warn('Failed to parse WebView message:', e);
    }
  }, [onChange, minHeight]);

  const execCommand = useCallback((command: FormatAction, value?: string) => {
    const script = value
      ? `document.execCommand('${command}', false, '${value}'); updateContent(); updateFormats(); true;`
      : `document.execCommand('${command}', false, null); updateContent(); updateFormats(); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const formatButton = (
    icon: React.ComponentProps<typeof Icon>['name'],
    command: FormatAction,
    value?: string,
    label?: string
  ) => {
    const isActive = activeFormats.has(command);
    return (
      <TouchableOpacity
        key={command}
        onPress={() => execCommand(command, value)}
        style={[
          styles.formatButton,
          isActive && { backgroundColor: theme.colors.primary + '30' },
        ]}
      >
        <Icon
          name={icon}
          size="sm"
          color={isActive ? theme.colors.primary : theme.colors.text}
        />
      </TouchableOpacity>
    );
  };

  // HTML source for the WebView editor
  const editorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      height: 100%;
      width: 100%;
      background-color: ${theme.colors.background};
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: ${theme.colors.text};
      padding: 12px;
      min-height: 100%;
    }
    #editor {
      outline: none;
      min-height: ${minHeight - 40}px;
      width: 100%;
    }
    #editor:empty:before {
      content: attr(data-placeholder);
      color: ${theme.colors.textMuted};
      pointer-events: none;
    }
    blockquote {
      border-left: 3px solid ${theme.colors.border};
      margin: 8px 0;
      padding-left: 12px;
      color: ${theme.colors.textMuted};
    }
    ul, ol {
      margin-left: 20px;
      padding: 4px 0;
    }
    li {
      margin: 4px 0;
    }
    a {
      color: ${theme.colors.primary};
    }
    code {
      background: ${theme.colors.backgroundSecondary};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    pre {
      background: ${theme.colors.backgroundSecondary};
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div
    id="editor"
    contenteditable="true"
    data-placeholder="${placeholder}"
  >${initialHtml}</div>

  <script>
    const editor = document.getElementById('editor');
    let debounceTimer;

    function getFormats() {
      const formats = [];
      if (document.queryCommandState('bold')) formats.push('bold');
      if (document.queryCommandState('italic')) formats.push('italic');
      if (document.queryCommandState('underline')) formats.push('underline');
      if (document.queryCommandState('strikethrough')) formats.push('strikethrough');
      if (document.queryCommandState('insertUnorderedList')) formats.push('insertUnorderedList');
      if (document.queryCommandState('insertOrderedList')) formats.push('insertOrderedList');
      return formats;
    }

    function updateContent() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const html = editor.innerHTML;
        const text = editor.innerText || '';
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'content',
          html: html,
          text: text
        }));
        
        // Update height
        const height = editor.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'height',
          height: height
        }));
      }, 100);
    }

    function updateFormats() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'format',
        formats: getFormats()
      }));
    }

    editor.addEventListener('input', updateContent);
    editor.addEventListener('keyup', updateFormats);
    editor.addEventListener('mouseup', updateFormats);
    document.addEventListener('selectionchange', updateFormats);

    // Initial content update
    setTimeout(updateContent, 100);
    
    ${autoFocus ? 'editor.focus();' : ''}
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Formatting Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {formatButton('format-bold', 'bold')}
        {formatButton('format-italic', 'italic')}
        {formatButton('format-underline', 'underline')}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        {formatButton('format-list-bulleted', 'insertUnorderedList')}
        {formatButton('format-list-numbered', 'insertOrderedList')}
      </View>

      {/* WebView Editor */}
      <View style={[styles.editorContainer, { minHeight: editorHeight }]}>
        <WebView
          ref={webViewRef}
          source={{ html: editorHtml }}
          style={styles.webview}
          onMessage={handleMessage}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          keyboardDisplayRequiresUserAction={false}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.xs,
  },
  formatButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: SPACING.xs,
  },
  editorContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
