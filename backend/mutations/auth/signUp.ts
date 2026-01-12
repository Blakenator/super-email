import { makeMutation } from '../../types.js';
import { User } from '../../db/models/index.js';
import { hashPassword, generateToken } from '../../helpers/auth.js';

export const signUp = makeMutation(
  'signUp',
  async (_parent, { input: { email, password, firstName, lastName } }) => {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    const token = generateToken(user.id);

    return {
      token,
      user,
    };
  },
);
