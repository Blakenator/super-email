import { makeQuery } from '../../types.js';
import {
  User,
  AuthenticationMethod,
  AuthProvider,
} from '../../db/models/index.js';
import { getUserFromToken } from '../../helpers/auth.js';
import { logger } from '../../helpers/logger.js';

/**
 * Fetches the current user's profile.
 * If the user doesn't exist in our database yet (first login after Supabase signup),
 * this will create the user and auth method records.
 */
export const fetchProfile = makeQuery(
  'fetchProfile',
  async (_parent, _args, context) => {
    if (!context.token) {
      return null;
    }

    // Get Supabase user info from token
    const supabaseUser = await getUserFromToken(context.token);
    if (!supabaseUser) {
      logger.warn('fetchProfile', 'getUserFromToken returned null - token may be invalid or expired');
      return null;
    }

    const supabaseUserId = supabaseUser.id;

    // Find auth method with this Supabase ID
    let authMethod = await AuthenticationMethod.findOne({
      where: { providerUserId: supabaseUserId },
    });

    let user: User | null = null;

    if (authMethod) {
      // Auth method exists - get the linked user
      user = await User.findByPk(authMethod.userId);

      // Update last used timestamp
      await authMethod.update({ lastUsedAt: new Date() });
    } else {
      // No auth method found - check if user with this email exists
      const existingUser = await User.findOne({
        where: { email: supabaseUser.email },
      });

      if (existingUser) {
        // Create auth method linking to existing user
        await AuthenticationMethod.create({
          userId: existingUser.id,
          provider: AuthProvider.EMAIL_PASSWORD,
          providerUserId: supabaseUserId,
          email: supabaseUser.email,
          displayName: `${supabaseUser.email} (Email/Password)`,
          lastUsedAt: new Date(),
        });

        user = existingUser;
      } else {
        // Create new user and auth method
        user = await User.create({
          email: supabaseUser.email,
          firstName: supabaseUser.firstName,
          lastName: supabaseUser.lastName,
        });

        await AuthenticationMethod.create({
          userId: user.id,
          provider: AuthProvider.EMAIL_PASSWORD,
          providerUserId: supabaseUserId,
          email: supabaseUser.email,
          displayName: `${supabaseUser.email} (Email/Password)`,
          lastUsedAt: new Date(),
        });
      }
    }

    return user;
  },
);
