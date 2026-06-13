import { api } from './client';
import type { AuthResponse, User } from '../../../shared/types';

export const login = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password }).then((r) => r.data);

export const getMe = () =>
  api.get<User>('/auth/me').then((r) => r.data);

export const updateMe = (data: { currentPassword?: string; newPassword?: string; email?: string }) =>
  api.put('/auth/me', data).then((r) => r.data);
