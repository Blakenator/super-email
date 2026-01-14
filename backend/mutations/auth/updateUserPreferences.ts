import { ThemePreference, NotificationDetailLevel, User } from '../../db/models/index.js';
import { makeMutation } from '../../types.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateUserPreferences = makeMutation(
  'updateUserPreferences',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updates: Partial<{
      themePreference: ThemePreference;
      navbarCollapsed: boolean;
      notificationDetailLevel: NotificationDetailLevel;
      inboxDensity: boolean;
      inboxGroupByDate: boolean;
    }> = {};

    // Validate and set theme preference
    if (input.themePreference !== undefined && input.themePreference !== null) {
      if (!Object.values(ThemePreference).includes(input.themePreference as ThemePreference)) {
        throw new Error('Invalid theme preference');
      }
      updates.themePreference = input.themePreference as ThemePreference;
    }

    // Set navbar collapsed state
    if (input.navbarCollapsed !== undefined && input.navbarCollapsed !== null) {
      updates.navbarCollapsed = input.navbarCollapsed;
    }

    // Validate and set notification detail level
    if (input.notificationDetailLevel !== undefined && input.notificationDetailLevel !== null) {
      if (!Object.values(NotificationDetailLevel).includes(input.notificationDetailLevel as NotificationDetailLevel)) {
        throw new Error('Invalid notification detail level');
      }
      updates.notificationDetailLevel = input.notificationDetailLevel as NotificationDetailLevel;
    }

    // Set inbox density preference
    if (input.inboxDensity !== undefined && input.inboxDensity !== null) {
      updates.inboxDensity = input.inboxDensity;
    }

    // Set inbox group by date preference
    if (input.inboxGroupByDate !== undefined && input.inboxGroupByDate !== null) {
      updates.inboxGroupByDate = input.inboxGroupByDate;
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await user.update(updates);
      await user.reload();
    }

    return user;
  },
);
