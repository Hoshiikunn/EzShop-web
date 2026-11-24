import { defineStore } from 'pinia';
import { profileApi } from '@/api/profile';

let permissionsRequest: Promise<void> | null = null;
let permissionsRequestId = 0;
let permissionsEnsurePromise: Promise<void> | null = null;

function resolvePermissionsError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '权限标识加载失败';
}

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: new Set<string>(),
    permissionsLoading: false,
    permissionsError: '',
    permissionsInitialized: false,
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
          this.permissionsInitialized = true;
        }
      }
    },
    async ensurePermissions(force = false) {
      if (!force && permissionsEnsurePromise) {
        return permissionsEnsurePromise;
      }

      const request = this.fetchPermissions(force);
      permissionsEnsurePromise = request;

      try {
        await request;
      } catch (error) {
        if (permissionsEnsurePromise === request) {
          permissionsEnsurePromise = null;
        }

        throw error;
      }
    },
    reset() {
      permissionsRequestId += 1;
      permissionsRequest = null;
      permissionsEnsurePromise = null;
      this.permissions.clear();
      this.permissionsLoading = false;
      this.permissionsError = '';
      this.permissionsInitialized = false;
    },
  },
});
