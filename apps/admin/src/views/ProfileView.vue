<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { RefreshCw } from 'lucide-vue-next';
import { profileApi } from '@/api/profile';
import type { ProfileInfo } from '@/types/api';
import { formatDateTime } from '@/utils/format';

const profile = ref<ProfileInfo | null>(null);
const profileLoading = ref(false);
const profileError = ref('');
const roles = ref<string[]>([]);
const rolesLoading = ref(false);
const rolesError = ref('');

const displayName = computed(() => {
  const name = profile.value?.realName || profile.value?.username;

  return name || '-';
});

const avatarInitials = computed(() => {
  const name = profile.value?.realName || profile.value?.username || '-';

  return name.slice(0, 1).toUpperCase();
});

function text(value?: string | null): string {
  return value?.trim() || '-';
}

function genderText(value?: 0 | 1 | null): string {
  if (value !== 0 && value !== 1) {
    return '-';
  }

  return value === 0 ? '女' : '男';
}

function time(value?: string | number | Date | null): string {
  return formatDateTime(value);
}

async function loadProfile() {
  profileLoading.value = true;
  profileError.value = '';

  try {
    profile.value = await profileApi.info();
  } catch (error) {
    profile.value = null;
    profileError.value =
      error instanceof Error ? error.message || '个人资料加载失败' : '个人资料加载失败';
    ElMessage.error(profileError.value);
  } finally {
    profileLoading.value = false;
  }
}

async function loadRoles() {
  rolesLoading.value = true;
  rolesError.value = '';

  try {
    roles.value = await profileApi.roles();
  } catch (error) {
    roles.value = [];
    rolesError.value =
      error instanceof Error ? error.message || '角色列表加载失败' : '角色列表加载失败';
    ElMessage.error(rolesError.value);
  } finally {
    rolesLoading.value = false;
  }
}

async function retryProfile() {
  await Promise.all([loadProfile(), loadRoles()]);
}

onMounted(() => {
  void Promise.allSettled([loadProfile(), loadRoles()]);
});
</script>

<template>
  <section class="profile-page">
    <div v-loading="profileLoading" class="panel profile-panel">
      <template v-if="profile">
        <div class="profile-header">
          <img
            v-if="profile.avatarUrl"
            class="profile-avatar"
            :src="profile.avatarUrl"
            alt="当前用户头像"
          />
          <span v-else class="profile-avatar">{{ avatarInitials }}</span>

          <div class="profile-heading">
            <h2>{{ displayName }}</h2>
            <p>{{ profile.username }}</p>
          </div>
        </div>

        <dl class="profile-list">
          <div>
            <dt>用户 ID</dt>
            <dd>{{ profile.id }}</dd>
          </div>
          <div>
            <dt>用户名</dt>
            <dd>{{ text(profile.username) }}</dd>
          </div>
          <div>
            <dt>真实姓名</dt>
            <dd>{{ text(profile.realName) }}</dd>
          </div>
          <div>
            <dt>性别</dt>
            <dd>{{ genderText(profile.gender) }}</dd>
          </div>
          <div>
            <dt>手机号</dt>
            <dd>{{ text(profile.mobile) }}</dd>
          </div>
          <div>
            <dt>邮箱</dt>
            <dd>{{ text(profile.email) }}</dd>
          </div>
          <div>
            <dt>最后登录 IP</dt>
            <dd>{{ text(profile.lastLoginIp) }}</dd>
          </div>
          <div>
            <dt>最后登录时间</dt>
            <dd>{{ time(profile.lastLoginTime) }}</dd>
          </div>
          <div>
            <dt>账号创建时间</dt>
            <dd>{{ time(profile.createTime) }}</dd>
          </div>
        </dl>
      </template>

      <div v-else-if="profileError" class="profile-error">
        <p>{{ profileError }}</p>
        <button type="button" @click="retryProfile">
          <RefreshCw :size="15" />
          重新加载
        </button>
      </div>
    </div>

    <div v-loading="rolesLoading" class="panel roles-panel">
      <div class="roles-head">
        <h2>已绑定角色</h2>
      </div>

      <div v-if="rolesError" class="roles-error">
        <p>{{ rolesError }}</p>
        <button type="button" @click="loadRoles">
          <RefreshCw :size="15" />
          重新加载
        </button>
      </div>

      <div v-else-if="roles.length === 0" class="roles-empty">暂无有效角色</div>

      <div v-else class="roles-tags">
        <span v-for="(role, index) in roles" :key="`${role}-${index}`" class="role-tag">
          {{ role }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 22px;
}

.panel {
  min-height: 180px;
  padding: 24px;
  border: 1px solid var(--ez-line);
  border-radius: 16px;
  background: #fff;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--ez-line);
}

.profile-avatar {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  overflow: hidden;
  color: #fff;
  background: var(--ez-primary);
  font-size: 28px;
  font-weight: 800;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-heading h2 {
  margin: 0;
  font-size: 24px;
}

.profile-heading p {
  margin: 5px 0 0;
  color: var(--ez-muted);
  font-size: 13px;
}

.profile-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 40px;
  margin: 22px 0 0;
}

.profile-list div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 12px;
  min-height: 42px;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid var(--ez-line);
}

.profile-list dt {
  color: var(--ez-muted);
}

.profile-list dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.profile-error,
.roles-error {
  display: grid;
  justify-items: center;
  gap: 12px;
  color: var(--ez-muted);
}

.profile-error p,
.roles-error p {
  margin: 0;
  color: #d2494a;
}

.profile-error button,
.roles-error button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: var(--ez-primary-dark);
  background: #fff;
  cursor: pointer;
}

.profile-error button:hover,
.roles-error button:hover {
  color: var(--ez-primary-dark);
  background: #f5f8ff;
}

.roles-head h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.roles-head p {
  margin: 5px 0 16px;
  color: var(--ez-muted);
  font-size: 13px;
}

.roles-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--ez-primary-dark);
  background: #eef3ff;
  font-size: 13px;
  font-weight: 600;
}

.roles-empty {
  display: grid;
  min-height: 84px;
  align-content: center;
  color: var(--ez-muted);
}

@media (max-width: 720px) {
  .profile-list {
    grid-template-columns: 1fr;
  }
}
</style>
