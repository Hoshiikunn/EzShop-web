<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import { profileApi } from '@/api/profile';
import SidebarMenu from '@/components/SidebarMenu.vue';
import { collectActiveMenuIds } from '@/utils/dynamic-routes';
import { loadMenuIconOptions } from '@/utils/menu-icons';
import type { ProfileInfo } from '@/types/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const navigationStore = useNavigationStore();
const appVersion = __APP_VERSION__;
const profile = ref<ProfileInfo | null>(null);

const activePath = computed(() => route.path);
const expandedMenuIds = ref(new Set<string>());

watchEffect(() => {
  expandedMenuIds.value = new Set(
    collectActiveMenuIds(navigationStore.sidebarItems, activePath.value),
  );
});

function toggleMenu(id: string) {
  const nextIds = new Set(expandedMenuIds.value);

  if (nextIds.has(id)) {
    nextIds.delete(id);
  } else {
    nextIds.add(id);
  }

  expandedMenuIds.value = nextIds;
}

const accountName = computed(() => {
  const name = profile.value?.realName || profile.value?.username;

  return name || '账号';
});

const accountInitials = computed(() => {
  const name = profile.value?.realName || profile.value?.username || 'E';

  return name.slice(0, 1).toUpperCase();
});

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  });

  await authStore.logout();
  ElMessage.success('已退出登录');
  await router.replace('/login');
}

async function handleAccountCommand(command: string | number | object) {
  if (command === 'profile') {
    await router.push('/profile');
    return;
  }

  if (command === 'logout') {
    await handleLogout();
  }
}

onMounted(() => {
  void navigationStore.ensureNavigation(router).catch(() => {
    ElMessage.error('导航菜单加载失败');
  });
  void profileApi
    .info()
    .then((result) => {
      profile.value = result;
    })
    .catch(() => undefined);
  void loadMenuIconOptions().catch(() => undefined);
});
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <RouterLink to="/dashboard" class="brand">
        <span class="brand-icon">E</span>
        <span>EzShop</span>
      </RouterLink>

      <nav class="nav">
        <SidebarMenu
          :items="navigationStore.sidebarItems"
          :active-path="activePath"
          :expanded-ids="expandedMenuIds"
          @toggle="toggleMenu"
        />
      </nav>

      <div class="sidebar-footer">
        <Settings :size="16" />
        <span>系统模块开发中</span>
      </div>

      <div class="sidebar-version">
        <span class="version-label">当前版本</span>
        <strong class="version-value">v{{ appVersion }}</strong>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div>
          <h1>{{ route.meta.title || 'EzShop Admin' }}</h1>
          <p>SpringBoot 后台控制台 · v{{ appVersion }}</p>
        </div>

        <el-dropdown
          class="account-dropdown"
          trigger="click"
          @command="handleAccountCommand"
        >
          <button class="account-button" type="button">
            <img
              v-if="profile?.avatarUrl"
              class="account-avatar"
              :src="profile.avatarUrl"
              alt="当前用户头像"
            />
            <span v-else class="account-avatar">{{ accountInitials }}</span>
            <span class="account-name">{{ accountName }}</span>
            <ChevronDown :size="16" />
          </button>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="UserRound">
                个人中心
              </el-dropdown-item>
              <el-dropdown-item divided command="logout" :icon="LogOut">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 22px 16px;
  border-right: 1px solid var(--ez-line);
  background: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 22px;
  color: var(--ez-ink);
  text-decoration: none;
  font-size: 18px;
  font-weight: 800;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #fff;
  background: var(--ez-primary);
}

.nav {
  display: grid;
  gap: 6px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 18px;
  color: var(--ez-muted);
  font-size: 12px;
}

.sidebar-version {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid var(--ez-line);
  border-radius: 10px;
  background: #f8faff;
  box-shadow: 0 1px 2px rgba(46, 65, 104, 0.04);
}

.version-label {
  color: #63718d;
  font-size: 13px;
  line-height: 1;
}

.version-value {
  color: var(--ez-primary-dark);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}

.workspace {
  display: grid;
  align-content: start;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 32px;
  border-bottom: 1px solid var(--ez-line);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
}

.topbar p {
  margin: 4px 0 0;
  color: var(--ez-muted);
  font-size: 13px;
}

.account-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  max-width: 220px;
  padding: 0 10px 0 4px;
  border: 1px solid var(--ez-line);
  border-radius: 9px;
  color: #4d5a75;
  background: #fff;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
  outline: none;
}

.account-button:hover {
  color: var(--ez-primary-dark);
  border-color: rgba(56, 102, 242, 0.38);
  background: #f5f8ff;
}

.account-avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  color: #fff;
  background: var(--ez-primary);
  font-size: 13px;
  font-weight: 700;
}

.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.account-dropdown :deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content {
  min-width: 0;
  padding: 28px 32px 36px;
}

@media (max-width: 760px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
    height: auto;
  }

  .nav {
    overflow-y: auto;
  }

  .sidebar-footer {
    display: none;
  }

  .topbar,
  .content {
    padding-inline: 16px;
  }
}
</style>
