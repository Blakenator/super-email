/**
 * Edit Tag Screen
 * Create or edit email tags
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
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_TAG_QUERY = gql`
  query GetTag($id: String!) {
    getTag(id: $id) {
      id
      name
      color
    }
  }
`;

const CREATE_TAG_MUTATION = gql`
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      id
      name
      color
    }
  }
`;

const UPDATE_TAG_MUTATION = gql`
  mutation UpdateTag($id: String!, $input: UpdateTagInput!) {
    updateTag(id: $id, input: $input) {
      id
      name
      color
    }
  }
`;

const DELETE_TAG_MUTATION = gql`
  mutation DeleteTag($id: String!) {
    deleteTag(id: $id)
  }
`;

// Predefined color options
const COLOR_OPTIONS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

interface EditTagScreenProps {
  onClose: () => void;
}

export function EditTagScreen({ onClose }: EditTagScreenProps) {
  const theme = useTheme();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const params = route.params as { tagId?: string } | undefined;
  const tagId = params?.tagId;
  const isEditing = !!tagId;

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[5]); // Default to green
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tagId) {
      loadTag();
    }
  }, [tagId]);

  const loadTag = async () => {
    if (!tagId) return;
    setIsLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_TAG_QUERY,
        variables: { id: tagId },
        fetchPolicy: 'network-only',
      });
      if (data?.getTag) {
        setName(data.getTag.name);
        setColor(data.getTag.color);
      }
    } catch (error) {
      console.error('Error loading tag:', error);
      Alert.alert('Error', 'Failed to load tag');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Tag name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await apolloClient.mutate({
          mutation: UPDATE_TAG_MUTATION,
          variables: {
            id: tagId,
            input: { name: name.trim(), color },
          },
          refetchQueries: ['GetTags'],
        });
        Alert.alert('Success', 'Tag updated', [{ text: 'OK', onPress: onClose }]);
      } else {
        await apolloClient.mutate({
          mutation: CREATE_TAG_MUTATION,
          variables: {
            input: { name: name.trim(), color },
          },
          refetchQueries: ['GetTags'],
        });
        Alert.alert('Success', 'Tag created', [{ text: 'OK', onPress: onClose }]);
      }
    } catch (error: any) {
      console.error('Error saving tag:', error);
      Alert.alert('Error', error.message || 'Failed to save tag');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Tag',
      'Are you sure you want to delete this tag? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await apolloClient.mutate({
                mutation: DELETE_TAG_MUTATION,
                variables: { id: tagId },
              });
              Alert.alert('Success', 'Tag deleted', [{ text: 'OK', onPress: onClose }]);
            } catch (error: any) {
              console.error('Error deleting tag:', error);
              Alert.alert('Error', error.message || 'Failed to delete tag');
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Tag' : 'New Tag'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !name.trim()}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colors.primary },
            (!name.trim() || isSaving) && { opacity: 0.5 },
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
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={[styles.previewContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.previewLabel, { color: theme.colors.textMuted }]}>Preview</Text>
          <View style={[styles.tagPreview, { backgroundColor: color + '20' }]}>
            <View style={[styles.tagDot, { backgroundColor: color }]} />
            <Text style={[styles.tagText, { color }]}>{name || 'Tag Name'}</Text>
          </View>
        </View>

        {/* Name Input */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Name</Text>
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <Icon name="tag" size="sm" color={theme.colors.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter tag name"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="words"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Color Picker */}
        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && <Icon name="check" size="sm" color={theme.colors.textInverse} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delete Button */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
          >
            <Icon name="trash-2" size="md" color={theme.colors.error} />
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
              Delete Tag
            </Text>
          </TouchableOpacity>
        )}
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  previewContainer: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  tagPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
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
});
