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

export type UserId = string;

export type Gender = 0 | 1;

export type RoleId = string;

export type RoleStatus = 0 | 1;

export interface UserPageQuery {
  current?: number;
  size?: number;
  id?: UserId;
  username?: string;
  realName?: string;
  gender?: 0 | 1;
  mobile?: string;
  status?: 0 | 1;
  createTimeBegin?: string;
  createTimeEnd?: string;
}

export interface UserPageItem {
  id: UserId;
  username: string;
  realName?: string;
  avatarUrl?: string;
  gender?: Gender;
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

export interface UserCreatePayload {
  username: string;
  realName: string;
  gender: Gender;
  avatarUrl?: string;
  mobile?: string;
  email?: string;
}

export interface UserUpdatePayload extends UserCreatePayload {
  id: UserId;
}

export interface UserInitInfo {
  username: string;
  initPassword: string;
}

export interface UserBatchDeletePayload {
  ids: UserId[];
}

export interface UserStatusPayload {
  id: UserId;
  status: 0 | 1;
}

export interface RolePageQuery {
  current?: number;
  size?: number;
  roleName?: string;
  roleKey?: string;
  status?: RoleStatus;
  createTimeBegin?: string;
  createTimeEnd?: string;
}

export interface RolePageItem {
  id: RoleId;
  roleName: string;
  roleKey: string;
  sort?: number;
  status: RoleStatus;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export type RoleInfo = RolePageItem;

export interface RoleMenuNode {
  id: RoleId;
  parentId?: RoleId;
  title: string;
  path?: string;
  icon?: string;
  sort?: number;
  visible?: 0 | 1;
  children?: RoleMenuNode[];
}
