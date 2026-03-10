import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { useEmailStore, EmailFolder } from '../../stores/emailStore';
import { Icon, IconName } from '../ui';

interface FolderConfig {
  key: EmailFolder;
  label: string;
  icon: IconName;
}

const FOLDERS: FolderConfig[] = [
  { key: 'INBOX', label: 'Inbox', icon: 'inbox' },
  { key: 'SENT', label: 'Sent', icon: 'send' },
  { key: 'DRAFTS', label: 'Drafts', icon: 'file-text' },
  { key: 'ARCHIVE', label: 'Archive', icon: 'archive' },
  { key: 'TRASH', label: 'Trash', icon: 'trash-2' },
];

interface ScreenConfig {
  route: 'Contacts' | 'Settings';
  label: string;
  icon: IconName;
}

const SCREENS: ScreenConfig[] = [
  { route: 'Contacts', label: 'Contacts', icon: 'users' },
  { route: 'Settings', label: 'Settings', icon: 'settings' },
];

export function DrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentFolder, setFolder } = useEmailStore();
  const activeRoute = props.state.routes[props.state.index]?.name;

  const handleFolderPress = (folder: EmailFolder) => {
    setFolder(folder);
    props.navigation.navigate('Inbox');
    props.navigation.closeDrawer();
  };

  const handleScreenPress = (route: string) => {
    props.navigation.navigate(route);
    props.navigation.closeDrawer();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, paddingTop: insets.top }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          FOLDERS
        </Text>
        <View style={styles.section}>
          {FOLDERS.map((folder) => {
            const isActive = activeRoute === 'Inbox' && currentFolder === folder.key;
            return (
              <TouchableOpacity
                key={folder.key}
                style={[
                  styles.item,
                  isActive && { backgroundColor: theme.colors.primary + '15' },
                ]}
                onPress={() => handleFolderPress(folder.key)}
                activeOpacity={0.7}
              >
                <Icon
                  name={folder.icon}
                  size="md"
                  color={isActive ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.itemLabel,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.text,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {folder.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.section}>
          {SCREENS.map((screen) => {
            const isActive = activeRoute === screen.route;
            return (
              <TouchableOpacity
                key={screen.route}
                style={[
                  styles.item,
                  isActive && { backgroundColor: theme.colors.primary + '15' },
                ]}
                onPress={() => handleScreenPress(screen.route)}
                activeOpacity={0.7}
              >
                <Icon
                  name={screen.icon}
                  size="md"
                  color={isActive ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.itemLabel,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.text,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {screen.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginVertical: 1,
  },
  itemLabel: {
    fontSize: FONT_SIZE.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
});
