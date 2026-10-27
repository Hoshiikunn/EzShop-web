export interface Result<T> {
  code: number;
  msg: string;
  data: T;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginToken {
  token: string;
  expiresAt: string;
}

export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface UserPageQuery {
  current?: number;
  size?: number;
  username?: string;
  realName?: string;
  gender?: 0 | 1;
  mobile?: string;
  status?: 0 | 1;
  createTimeBegin?: string;
  createTimeEnd?: string;
}

export interface UserPageItem {
  id: number;
  username: string;
  realName?: string;
  avatarUrl?: string;
  gender?: 0 | 1;
  mobile?: string;
  status: 0 | 1;
  createTime?: string;
}

export interface UserInfo extends UserPageItem {
  email?: string;
  isSuperAdmin?: 0 | 1;
  lastLoginIp?: string;
  lastLoginTime?: string;
  updateTime?: string;
}
