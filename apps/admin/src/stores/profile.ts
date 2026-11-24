import { defineStore } from 'pinia';
import { profileApi } from '@/api/profile';
import type { ProfileInfo } from '@/types/api';

let profileRequest: Promise<void> | null = null;
let profileRequestId = 0;

function resolveProfileError(error: unknown): string {
  return error instanceof Error && error.message ? error.message : '个人资料加载失败';
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as ProfileInfo | null,
    profileLoading: false,
    profileError: '',
  }),
  actions: {
    async fetchProfile(force = false) {
      if (!force && profileRequest) {
        return profileRequest;
      }

      const requestId = ++profileRequestId;
      this.profileLoading = true;
      this.profileError = '';

      try {
        this.profile = await profileApi.info();
      } catch (error) {
        this.profile = null;
        this.profileError = resolveProfileError(error);
        throw error;
      } finally {
        if (profileRequestId === requestId) {
          this.profileLoading = false;
          profileRequest = null;
        }
      }
    },
    setProfile(profile: ProfileInfo) {
      this.profile = profile;
      this.profileError = '';
    },
    clearProfile() {
      profileRequestId += 1;
      profileRequest = null;
      this.profile = null;
      this.profileLoading = false;
      this.profileError = '';
    },
  },
});
