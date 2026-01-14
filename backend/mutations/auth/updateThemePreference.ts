import { ThemePreference } from '../../db/models/index.js';
import { makeMutation } from '../../types.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateThemePreference = makeMutation(
  'updateThemePreference',
  async (_parent, { themePreference }, context) => {
    requireAuth(context);

    const user = context.user;
    if (!user) {
      throw new Error('User not found');
    }

    // Validate the theme preference value
    if (!Object.values(ThemePreference).includes(themePreference as ThemePreference)) {
      throw new Error('Invalid theme preference');
    }

    await user.update({ themePreference: themePreference as ThemePreference });
    await user.reload();

    return user;
  },
);
