import { makeMutation } from '../../types.js';
import { User } from '../../db/models/user.model.js';
import { requireAuth } from '../../helpers/auth.js';

export const completeSetupWizard = makeMutation(
  'completeSetupWizard',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ setupWizardCompletedAt: new Date() });
    await user.reload();
    return user;
  },
);
