import { CreateUserRequest, UpdateUserRequest } from '@/types/user';

export const MAX_USERS = 15;
export const AUTO_DISMISS_MS = 3000;
export const USER_LIMIT_MESSAGE = `ถึงจำนวนผู้ใช้งานสูงสุดแล้ว (${MAX_USERS}) กรุณาลบผู้ใช้งานก่อนเพิ่มใหม่`;

export const INITIAL_CREATE_FORM: CreateUserRequest = {
  username: '',
  password: '',
  role: 'user',
};

export const INITIAL_EDIT_FORM: UpdateUserRequest = {
  username: '',
  role: 'user',
  isActive: true,
};


