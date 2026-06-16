import * as zod from 'zod';

export const LoginBody = zod.object({
  username: zod.string().min(1, "Username is required"),
  password: zod.string().min(1, "Password is required"),
});

export const UserResponse = zod.object({
  id: zod.string(),
  username: zod.string(),
  name: zod.string(),
});
