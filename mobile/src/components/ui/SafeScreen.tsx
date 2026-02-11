/**
 * SafeScreen - Core component for safe area handling
 * Provides consistent safe area insets across all screens
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface SafeScreenProps {
  children: React.ReactNode;
  /** Apply padding to specific edges (default: top) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Use ScrollView instead of View */
  scroll?: boolean;
  /** Custom background color (defaults to theme background) */
  backgroundColor?: string;
  /** Additional styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Additional styles for scroll content */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Whether the content can pull to refresh */
  refreshControl?: React.ReactElement;
}

/**
 * Hook to get safe area insets with edge-based padding styles
 */
export function useSafeInsets(
  edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top'],
) {
  const insets = useSafeAreaInsets();

  const getPadding = (): ViewStyle => {
    const padding: ViewStyle = {};
    if (edges.includes('top')) padding.paddingTop = insets.top;
    if (edges.includes('bottom')) padding.paddingBottom = insets.bottom;
    if (edges.includes('left')) padding.paddingLeft = insets.left;
    if (edges.includes('right')) padding.paddingRight = insets.right;
    return padding;
  };

  return {
    insets,
    padding: getPadding(),
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
  };
}

/**
 * SafeScreen component - wraps content with safe area insets
 */
export function SafeScreen({
  children,
  edges = ['top'],
  scroll = false,
  backgroundColor,
  style,
  contentContainerStyle,
  refreshControl,
}: SafeScreenProps) {
  const theme = useTheme();
  const { padding } = useSafeInsets(edges);
  const bgColor = backgroundColor ?? theme.colors.background;

  if (scroll) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }, style]}
        contentContainerStyle={[
          styles.scrollContent,
          padding,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor }, padding, style]}
    >
      {children}
    </View>
  );
}

/**
 * SafeHeader - A header component that respects safe area
 */
interface SafeHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SafeHeader({ children, style }: SafeHeaderProps) {
  const theme = useTheme();
  const { top } = useSafeInsets(['top']);

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingTop: top,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
