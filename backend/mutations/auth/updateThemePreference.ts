import { ThemePreference, User } from '../../db/models/index.js';
import { makeMutation } from '../../types.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateThemePreference = makeMutation(
  'updateThemePreference',
  async (_parent, { themePreference }, context) => {
    requireAuth(context);

    const user = await User.findByPk(context.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!Object.values(ThemePreference).includes(themePreference as ThemePreference)) {
      throw new Error('Invalid theme preference');
    }

    await user.update({ themePreference: themePreference as ThemePreference });
    await user.reload();

    return user;
  },
);
