/**
 * ModalScreen - Standard modal screen layout with header
 * Use for full-screen modals with consistent header styling
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, IconName } from './Icon';

interface ModalScreenProps {
  /** Title displayed in the header */
  title: string;
  /** Handler for close/cancel button */
  onClose: () => void;
  /** Content to render in the modal body */
  children: React.ReactNode;
  /** Whether the content should be scrollable (default: true) */
  scrollable?: boolean;
  /** Right action button configuration */
  rightAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    icon?: IconName;
  };
  /** Use keyboard avoiding view (for forms) */
  keyboardAvoiding?: boolean;
  /** Additional padding at the bottom (for forms with submit buttons) */
  bottomPadding?: boolean;
}

export function ModalScreen({
  title,
  onClose,
  children,
  scrollable = true,
  rightAction,
  keyboardAvoiding = false,
  bottomPadding = false,
}: ModalScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        bottomPadding && { paddingBottom: insets.bottom + SPACING.xl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, bottomPadding && { paddingBottom: insets.bottom }]}>
      {children}
    </View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            disabled={rightAction.loading || rightAction.disabled}
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
              (rightAction.loading || rightAction.disabled) && styles.actionButtonDisabled,
            ]}
          >
            {rightAction.loading ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <>
                {rightAction.icon && (
                  <Icon name={rightAction.icon} size="sm" color={theme.colors.textInverse} />
                )}
                <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>
                  {rightAction.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {body}
    </View>
  );
}

/**
 * FormField - Standard form field container with label
 */
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}

export function FormField({ label, children, required, hint }: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
      {children}
      {hint && (
        <Text style={[styles.fieldHint, { color: theme.colors.textMuted }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
    minWidth: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  fieldHint: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
});
