/**
 * Shared style constants for consistent UI
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * Create a color with alpha transparency
 * @param hex - Hex color string (e.g., '#667eea')
 * @param alpha - Alpha value from 0 to 1 (e.g., 0.2 for 20% opacity)
 */
export function withAlpha(hex: string, alpha: number): string {
  // Convert alpha to hex (0-255)
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${alphaHex}`;
}

/**
 * Common color values for white text (use theme.colors.textInverse when possible)
 */
export const COLORS = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Standard spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Standard border radii
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Standard font sizes
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Standard icon sizes
export const ICON_SIZE = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
} as const;

// Common styles used across screens
export const sharedStyles = StyleSheet.create({
  // Screen containers
  screen: {
    flex: 1,
  },
  screenPadded: {
    flex: 1,
    padding: SPACING.md,
  },
  screenScrollContent: {
    paddingBottom: SPACING.xl,
  },
  
  // Cards & Sections
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // List items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  listItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: FONT_SIZE.lg,
  },
  listItemSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  
  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Center content
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  
  // Dividers
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  dividerVertical: {
    width: StyleSheet.hairlineWidth,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  
  // Modal/Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  
  // Avatar
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarMd: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
