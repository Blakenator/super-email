/**
 * Edit Mail Rule Screen
 * Create or edit mail filtering rules
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, SafeHeader } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_MAIL_RULE_QUERY = gql`
  query GetMailRule($id: String!) {
    getMailRule(id: $id) {
      id
      name
      description
      isEnabled
      priority
      stopProcessing
      conditions {
        fromContains
        toContains
        subjectContains
        bodyContains
        hasAttachments
      }
      actions {
        markAsRead
        markAsStarred
        moveToFolder
        addTags
        forwardTo
        deleteEmail
      }
    }
  }
`;

const CREATE_MAIL_RULE_MUTATION = gql`
  mutation CreateMailRule($input: CreateMailRuleInput!) {
    createMailRule(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_MAIL_RULE_MUTATION = gql`
  mutation UpdateMailRule($input: UpdateMailRuleInput!) {
    updateMailRule(input: $input) {
      id
      name
    }
  }
`;

const DELETE_MAIL_RULE_MUTATION = gql`
  mutation DeleteMailRule($id: String!) {
    deleteMailRule(id: $id)
  }
`;

interface EditRuleScreenProps {
  onClose: () => void;
}

export function EditRuleScreen({ onClose }: EditRuleScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const params = route.params as { ruleId?: string } | undefined;
  const ruleId = params?.ruleId;
  const isEditing = !!ruleId;

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [priority, setPriority] = useState('10');
  const [stopProcessing, setStopProcessing] = useState(false);

  // Conditions
  const [fromContains, setFromContains] = useState('');
  const [toContains, setToContains] = useState('');
  const [subjectContains, setSubjectContains] = useState('');
  const [bodyContains, setBodyContains] = useState('');
  const [hasAttachments, setHasAttachments] = useState<boolean | null>(null);

  // Actions
  const [markAsRead, setMarkAsRead] = useState(false);
  const [markAsStarred, setMarkAsStarred] = useState(false);
  const [moveToFolder, setMoveToFolder] = useState('');
  const [deleteEmail, setDeleteEmail] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ruleId) {
      loadRule();
    }
  }, [ruleId]);

  const loadRule = async () => {
    if (!ruleId) return;
    setIsLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_MAIL_RULE_QUERY,
        variables: { id: ruleId },
        fetchPolicy: 'network-only',
      });
      if (data?.getMailRule) {
        const rule = data.getMailRule;
        setName(rule.name);
        setDescription(rule.description || '');
        setIsEnabled(rule.isEnabled);
        setPriority(String(rule.priority));
        setStopProcessing(rule.stopProcessing);
        
        // Conditions
        if (rule.conditions) {
          setFromContains(rule.conditions.fromContains || '');
          setToContains(rule.conditions.toContains || '');
          setSubjectContains(rule.conditions.subjectContains || '');
          setBodyContains(rule.conditions.bodyContains || '');
          setHasAttachments(rule.conditions.hasAttachments);
        }
        
        // Actions
        if (rule.actions) {
          setMarkAsRead(rule.actions.markAsRead || false);
          setMarkAsStarred(rule.actions.markAsStarred || false);
          setMoveToFolder(rule.actions.moveToFolder || '');
          setDeleteEmail(rule.actions.deleteEmail || false);
        }
      }
    } catch (error) {
      console.error('Error loading rule:', error);
      Alert.alert('Error', 'Failed to load rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Rule name is required');
      return;
    }

    // Must have at least one condition
    if (!fromContains && !toContains && !subjectContains && !bodyContains && hasAttachments === null) {
      Alert.alert('Error', 'At least one condition is required');
      return;
    }

    // Must have at least one action
    if (!markAsRead && !markAsStarred && !moveToFolder && !deleteEmail) {
      Alert.alert('Error', 'At least one action is required');
      return;
    }

    const conditions = {
      ...(fromContains ? { fromContains } : {}),
      ...(toContains ? { toContains } : {}),
      ...(subjectContains ? { subjectContains } : {}),
      ...(bodyContains ? { bodyContains } : {}),
      ...(hasAttachments !== null ? { hasAttachments } : {}),
    };

    const actions = {
      ...(markAsRead ? { markAsRead } : {}),
      ...(markAsStarred ? { markAsStarred } : {}),
      ...(moveToFolder ? { moveToFolder } : {}),
      ...(deleteEmail ? { deleteEmail } : {}),
    };

    setIsSaving(true);
    try {
      if (isEditing) {
        await apolloClient.mutate({
          mutation: UPDATE_MAIL_RULE_MUTATION,
          variables: {
            input: {
              id: ruleId,
              name: name.trim(),
              description: description.trim() || undefined,
              isEnabled,
              priority: parseInt(priority, 10),
              stopProcessing,
              conditions,
              actions,
            },
          },
          refetchQueries: ['GetMailRules'],
        });
        Alert.alert('Success', 'Rule updated', [{ text: 'OK', onPress: onClose }]);
      } else {
        await apolloClient.mutate({
          mutation: CREATE_MAIL_RULE_MUTATION,
          variables: {
            input: {
              name: name.trim(),
              description: description.trim() || undefined,
              isEnabled,
              priority: parseInt(priority, 10),
              stopProcessing,
              conditions,
              actions,
            },
          },
          refetchQueries: ['GetMailRules'],
        });
        Alert.alert('Success', 'Rule created', [{ text: 'OK', onPress: onClose }]);
      }
    } catch (error: any) {
      console.error('Error saving rule:', error);
      Alert.alert('Error', error.message || 'Failed to save rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await apolloClient.mutate({
                mutation: DELETE_MAIL_RULE_MUTATION,
                variables: { id: ruleId },
                refetchQueries: ['GetMailRules'],
              });
              Alert.alert('Success', 'Rule deleted', [{ text: 'OK', onPress: onClose }]);
            } catch (error: any) {
              console.error('Error deleting rule:', error);
              Alert.alert('Error', error.message || 'Failed to delete rule');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeHeader style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Rule' : 'New Mail Rule'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colors.primary },
            isSaving && { opacity: 0.5 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.textInverse} />
          ) : (
            <>
              <Icon name="check" size="sm" color={theme.colors.textInverse} />
              <Text style={[styles.saveButtonText, { color: theme.colors.textInverse }]}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeHeader>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Basic Info */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>BASIC INFO</Text>
        
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Rule Name *</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Move newsletters to folder"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Description</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What does this rule do?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
          />
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Enabled</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Conditions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>CONDITIONS (match any)</Text>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>From Contains</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={fromContains}
            onChangeText={setFromContains}
            placeholder="e.g., newsletter@"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>To Contains</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={toContains}
            onChangeText={setToContains}
            placeholder="e.g., team@"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Subject Contains</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={subjectContains}
            onChangeText={setSubjectContains}
            placeholder="e.g., [URGENT]"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>ACTIONS</Text>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Mark as Read</Text>
            <Switch
              value={markAsRead}
              onValueChange={setMarkAsRead}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Mark as Starred</Text>
            <Switch
              value={markAsStarred}
              onValueChange={setMarkAsStarred}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.error }]}>Delete Email</Text>
            <Switch
              value={deleteEmail}
              onValueChange={setDeleteEmail}
              trackColor={{ true: theme.colors.error }}
            />
          </View>
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Move to Folder</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={moveToFolder}
            onChangeText={setMoveToFolder}
            placeholder="e.g., ARCHIVE, TRASH"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
          />
        </View>

        {/* Delete Button */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
          >
            <Icon name="trash-2" size="md" color={theme.colors.error} />
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
              Delete Rule
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    textTransform: 'uppercase',
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
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: SPACING.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});
