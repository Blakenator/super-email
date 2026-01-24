/**
 * Tags Settings Screen
 * Manage email tags/labels
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const GET_TAGS_QUERY = gql`
  query GetTags {
    getTags {
      id
      name
      color
    }
  }
`;

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsSettingsScreenProps {
  onEditTag?: (tagId: string) => void;
  onAddTag?: () => void;
}

export function TagsSettingsScreen({ onEditTag, onAddTag }: TagsSettingsScreenProps) {
  const theme = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_TAGS_QUERY,
        fetchPolicy: 'network-only',
      });
      setTags(data?.getTags ?? []);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTag = (tag: Tag) => (
    <TouchableOpacity
      key={tag.id}
      style={[
        styles.tagItem,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
      onPress={() => onEditTag?.(tag.id)}
    >
      <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
      <Text style={[styles.tagName, { color: theme.colors.text }]}>{tag.name}</Text>
      <Icon name="chevron-right" size="md" color={theme.colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={sharedStyles.screenScrollContent}
    >
      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          TAGS
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {tags.length === 0 && !isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Icon name="tag" size="xl" color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No tags yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Create tags to organize your emails.
            </Text>
          </View>
        ) : (
          tags.map(renderTag)
        )}
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={onAddTag}
      >
        <Icon name="plus" size="md" color={theme.colors.textInverse} />
        <Text style={[styles.addButtonText, { color: theme.colors.textInverse }]}>Create Tag</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  tagColor: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
  },
  tagName: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
