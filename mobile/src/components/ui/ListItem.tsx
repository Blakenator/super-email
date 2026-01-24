/**
 * ListItem - Reusable list item component for settings and menus
 * Used throughout the app for consistent list styling
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, IconName } from './Icon';

interface ListItemProps {
  /** Icon to display on the left */
  icon?: IconName;
  /** Main title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Press handler - if not provided, item is not pressable */
  onPress?: () => void;
  /** Show right chevron arrow (only when onPress is provided and no rightElement) */
  showChevron?: boolean;
  /** Custom element to render on the right side */
  rightElement?: React.ReactNode;
  /** Show bottom border */
  showBorder?: boolean;
  /** Use destructive (error) color for icon and title */
  destructive?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom icon color (overrides default) */
  iconColor?: string;
  /** Value text to show on the right (before chevron) */
  value?: string;
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
  showBorder = true,
  destructive = false,
  disabled = false,
  iconColor,
  value,
}: ListItemProps) {
  const theme = useTheme();

  const titleColor = destructive ? theme.colors.error : theme.colors.text;
  const defaultIconColor = destructive ? theme.colors.error : theme.colors.textMuted;
  const resolvedIconColor = iconColor ?? defaultIconColor;

  const content = (
    <>
      {icon && (
        <View style={styles.iconContainer}>
          <Icon name={icon} size="md" color={resolvedIconColor} />
        </View>
      )}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: titleColor },
            disabled && styles.disabled,
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textMuted },
              disabled && styles.disabled,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {value && !rightElement && (
        <Text style={[styles.value, { color: theme.colors.textMuted }]}>
          {value}
        </Text>
      )}
      {rightElement}
      {!rightElement && onPress && showChevron && (
        <Icon name="chevron-right" size="md" color={theme.colors.textMuted} />
      )}
    </>
  );

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.surface },
    showBorder && { borderBottomColor: theme.colors.border },
    showBorder && styles.border,
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={containerStyle}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

/**
 * ListItemSwitch - List item variant with a toggle switch
 */
interface ListItemSwitchProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showBorder?: boolean;
  disabled?: boolean;
}

export function ListItemSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  showBorder = true,
  disabled = false,
}: ListItemSwitchProps) {
  const theme = useTheme();

  return (
    <ListItem
      icon={icon}
      title={title}
      subtitle={subtitle}
      showBorder={showBorder}
      showChevron={false}
      disabled={disabled}
      rightElement={
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          thumbColor={theme.colors.textInverse}
        />
      }
    />
  );
}

/**
 * ListSection - Section header for grouped list items
 */
interface ListSectionProps {
  title: string;
}

export function ListSection({ title }: ListSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
        {title}
      </Text>
    </View>
  );
}

/**
 * ListGroup - Wrapper for a group of list items with optional section title
 */
interface ListGroupProps {
  title?: string;
  children: React.ReactNode;
}

export function ListGroup({ title, children }: ListGroupProps) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      {title && <ListSection title={title} />}
      <View style={[styles.groupContent, { backgroundColor: theme.colors.surface }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    minHeight: 52,
    gap: SPACING.sm,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.lg,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  value: {
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.xs,
  },
  disabled: {
    opacity: 0.5,
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
  group: {
    marginBottom: SPACING.sm,
  },
  groupContent: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
});
