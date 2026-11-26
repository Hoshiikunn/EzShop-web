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

export type MenuId = string;

export type MenuType = 'M' | 'C' | 'F';

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
  roles?: RoleBriefItem[];
}

export interface UserCreatePayload {
  username: string;
  realName: string;
  gender: Gender;
  avatarUrl?: string;
  mobile?: string;
  email?: string;
  roleIds?: RoleId[];
}

export interface UserUpdatePayload extends UserCreatePayload {
  id: UserId;
}

export interface UserInitInfo {
  username: string;
  initPassword: string;
}

export interface UserResetPasswordInfo {
  username: string;
  resetPassword: string;
}

export interface ProfileInfo {
  id: UserId;
  username: string;
  realName?: string;
  avatarUrl?: string;
  gender?: Gender;
  mobile?: string;
  email?: string;
  lastLoginIp?: string;
  lastLoginTime?: string;
  createTime?: string;
}

export interface ProfileChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface ProfileChangeUsernamePayload {
  newUsername: string;
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

export type RoleListItem = RolePageItem;

export interface RoleBriefItem {
  id: RoleId;
  roleName: string;
}

export interface RoleCreatePayload {
  roleName: string;
  roleKey: string;
  sort: number;
  remark?: string;
  menuIds?: MenuId[];
}

export interface RoleUpdatePayload extends Omit<RoleCreatePayload, 'roleKey'> {
  id: RoleId;
}

export interface RoleStatusPayload {
  id: RoleId;
  status: RoleStatus;
}

export interface RoleDeleteQuery {
  force?: boolean;
}

export interface RoleInfo extends RolePageItem {
  menuIds?: MenuId[];
}

export interface MenuTreeNode {
  id: MenuId;
  pid: MenuId;
  menuName: string;
  menuType: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sort?: number;
  visible?: 0 | 1;
  children: MenuTreeNode[];
}

export interface MenuItem {
  id: MenuId;
  pid: MenuId;
  menuName: string;
  menuType: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sort?: number;
  visible?: 0 | 1;
}

export interface MenuInfo extends MenuItem {
  openStyle?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}

export interface MenuBasePayload {
  pid: MenuId;
  menuName: string;
  sort: number;
}

export interface MenuDirectoryPayload extends MenuBasePayload {
  menuType: 'M';
  path?: string;
  icon?: string;
  visible: 0 | 1;
}

export interface MenuPagePayload extends MenuBasePayload {
  menuType: 'C';
  path?: string;
  component?: string;
  icon?: string;
  visible: 0 | 1;
  openStyle: 0 | 1;
}

export interface MenuPermissionPayload extends MenuBasePayload {
  menuType: 'F';
  perms: string;
}

export type MenuCreatePayload =
  | MenuDirectoryPayload
  | MenuPagePayload
  | MenuPermissionPayload;

export type MenuUpdatePayload = MenuCreatePayload & {
  id: MenuId;
};

export type LoginLogId = string;

export type LoginLogStatus = 0 | 1;

export interface LoginLogPageQuery {
  current?: number;
  size?: number;
  username?: string;
  userId?: UserId;
  ip?: string;
  status?: LoginLogStatus;
  createTimeBegin?: string;
  createTimeEnd?: string;
}

export interface LoginLogPageItem {
  id: LoginLogId;
  username: string;
  userId: UserId;
  ip?: string;
  loginLocation?: string;
  os?: string;
  browser?: string;
  status: LoginLogStatus;
  message?: string;
  createTime?: string;
}

export type OperLogId = string;

export type OperLogStatus = 0 | 1;

export interface OperLogPageQuery {
  current?: number;
  size?: number;
  module?: string;
  operation?: string;
  username?: string;
  userId?: UserId;
  ip?: string;
  status?: OperLogStatus;
  createTimeBegin?: string;
  createTimeEnd?: string;
}

export interface OperLogPageItem {
  id: OperLogId;
  module?: string;
  operation?: string;
  userId: UserId;
  username?: string;
  requestMethod?: string;
  requestUri?: string;
  ip?: string;
  operLocation?: string;
  requestParams?: string;
  status: OperLogStatus;
  errorMsg?: string;
  elapsedMs?: number;
  createTime?: string;
}
