import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  useColorScheme,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { useEmailStore, EmailFolder } from '../../stores/emailStore';
import { useAuthStore, ThemePreference } from '../../stores/authStore';
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

const THEME_ORDER: ThemePreference[] = ['LIGHT', 'DARK', 'AUTO'];
const THEME_ICONS: Record<ThemePreference, IconName> = {
  LIGHT: 'sun',
  DARK: 'moon',
  AUTO: 'smartphone',
};

function getThemeLabel(pref: ThemePreference, systemIsDark: boolean): string {
  if (pref === 'LIGHT') return 'Light Mode';
  if (pref === 'DARK') return 'Dark Mode';
  return `System (${systemIsDark ? 'Dark' : 'Light'})`;
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const systemIsDark = systemColorScheme === 'dark';
  const { currentFolder, setFolder, emailAccounts, currentAccountId, setAccountId } = useEmailStore();
  const themePreference = useAuthStore((state) => state.user?.themePreference) ?? 'AUTO';
  const setThemePreference = useAuthStore((state) => state.setThemePreference);
  const activeRoute = props.state.routes[props.state.index]?.name;
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const currentAccount = emailAccounts.find((a) => a.id === currentAccountId);

  const handleAccountSelect = useCallback(
    (accountId: string | null) => {
      setAccountId(accountId);
      setShowAccountPicker(false);
    },
    [setAccountId],
  );

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
        {/* Account Switcher */}
        <TouchableOpacity
          style={[styles.accountSwitcher, { borderBottomColor: theme.colors.border }]}
          onPress={() => setShowAccountPicker(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.accountSwitcherAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Icon
              name={currentAccountId ? 'mail' : 'inbox'}
              size="sm"
              color={theme.colors.textInverse}
            />
          </View>
          <View style={styles.accountSwitcherInfo}>
            <Text
              style={[styles.accountSwitcherLabel, { color: theme.colors.textMuted }]}
            >
              Account
            </Text>
            <Text
              style={[styles.accountSwitcherText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {currentAccount?.name || 'All Accounts'}
            </Text>
          </View>
          <Icon
            name="chevron-down"
            size="sm"
            color={theme.colors.textMuted}
          />
        </TouchableOpacity>

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

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          APPEARANCE
        </Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              const nextIndex = (THEME_ORDER.indexOf(themePreference) + 1) % THEME_ORDER.length;
              setThemePreference(THEME_ORDER[nextIndex]);
            }}
            activeOpacity={0.7}
          >
            <Icon
              name={THEME_ICONS[themePreference]}
              size="md"
              color={theme.colors.primary}
            />
            <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
              {getThemeLabel(themePreference, systemIsDark)}
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAccountPicker(false)}
        >
          <View
            style={[
              styles.accountPickerModal,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(insets.bottom, SPACING.md),
              },
            ]}
          >
            <View
              style={[
                styles.pickerHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                Select Account
              </Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <Icon name="x" size="md" color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.accountOption,
                { borderBottomColor: theme.colors.border },
                currentAccountId === null && {
                  backgroundColor: theme.colors.primary + '10',
                },
              ]}
              onPress={() => handleAccountSelect(null)}
            >
              <View
                style={[
                  styles.accountAvatar,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Icon name="inbox" size="sm" color={theme.colors.textInverse} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: theme.colors.text }]}>
                  All Accounts
                </Text>
                <Text
                  style={[styles.accountEmail, { color: theme.colors.textMuted }]}
                >
                  View emails from all accounts
                </Text>
              </View>
              {currentAccountId === null && (
                <Icon name="check" size="md" color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            {emailAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountOption,
                  { borderBottomColor: theme.colors.border },
                  currentAccountId === account.id && {
                    backgroundColor: theme.colors.primary + '10',
                  },
                ]}
                onPress={() => handleAccountSelect(account.id)}
              >
                <View
                  style={[
                    styles.accountAvatar,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <Icon name="mail" size="sm" color={theme.colors.textInverse} />
                </View>
                <View style={styles.accountInfo}>
                  <Text
                    style={[styles.accountName, { color: theme.colors.text }]}
                  >
                    {account.name}
                  </Text>
                  <Text
                    style={[
                      styles.accountEmail,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {account.email}
                  </Text>
                </View>
                {currentAccountId === account.id && (
                  <Icon name="check" size="md" color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  accountSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountSwitcherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountSwitcherInfo: {
    flex: 1,
  },
  accountSwitcherLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  accountSwitcherText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  accountPickerModal: {
    borderRadius: RADIUS.lg,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  accountEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
});
