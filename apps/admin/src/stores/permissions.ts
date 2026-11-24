import { defineStore } from 'pinia';
import { profileApi } from '@/api/profile';

let permissionsRequest: Promise<void> | null = null;
let permissionsRequestId = 0;

function resolvePermissionsError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '权限标识加载失败';
}

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: new Set<string>(),
    permissionsLoading: false,
    permissionsError: '',
  }),
  getters: {
    hasPermission: (state) => (permission: string) =>
      state.permissions.has('*') || state.permissions.has(permission),
    hasAnyPermission: (state) => (requiredPermissions: string[]) => {
      if (requiredPermissions.length === 0) {
        return true;
      }

      return (
        state.permissions.has('*') ||
        requiredPermissions.some((permission) => state.permissions.has(permission))
      );
    },
    hasAllPermissions: (state) => (requiredPermissions: string[]) =>
      requiredPermissions.every((permission) =>
        state.permissions.has('*') || state.permissions.has(permission),
      ),
  },
  actions: {
    async fetchPermissions(force = false) {
      if (!force && permissionsRequest) {
        return permissionsRequest;
      }

      const requestId = ++permissionsRequestId;
      this.permissionsLoading = true;
      this.permissionsError = '';

      try {
        this.permissions = new Set(await profileApi.permissions());
      } catch (error) {
        this.permissions.clear();
        this.permissionsError = resolvePermissionsError(error);
        throw error;
      } finally {
        if (permissionsRequestId === requestId) {
          this.permissionsLoading = false;
          permissionsRequest = null;
        }
      }
    },
    reset() {
      permissionsRequestId += 1;
      permissionsRequest = null;
      this.permissions.clear();
      this.permissionsLoading = false;
      this.permissionsError = '';
    },
  },
});
