import { makeMutation } from '../../types.js';
import { User } from '../../db/models/index.js';
import { verifyPassword, generateToken } from '../../helpers/auth.js';

export const login = makeMutation(
  'login',
  async (_parent, { input: { email, password } }) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user.id);

    return {
      token,
      user,
    };
  },
);
