<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Activity, CircleCheck, Clock3, Users } from 'lucide-vue-next';
import { sysUserApi } from '@/api/sys-user';
import { useAuthStore } from '@/stores/auth';
import { formatDuration } from '@/utils/format';

const authStore = useAuthStore();
const userTotal = ref<number | null>(null);
const dashboardLoading = ref(false);
const currentTime = ref(new Date());

const tokenRemaining = computed(() =>
  formatDuration((authStore.expiresAt ?? 0) - currentTime.value.getTime()),
);

const clockText = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(currentTime.value),
);

const modules = [
  { title: '登录认证', status: '已接入', detail: 'POST /admin/auth/login' },
  { title: '登出处理', status: '已接入', detail: 'POST /admin/auth/logout' },
  { title: '用户分页', status: '已接入', detail: 'GET /admin/sys/user/page' },
  { title: '用户详情', status: '已接入', detail: 'GET /admin/sys/user/{id}' },
  { title: '动态菜单', status: '已预留', detail: 'GET /admin/sys/menu/list' },
];

let timer: number | undefined;

async function loadDashboard() {
  dashboardLoading.value = true;

  try {
    const page = await sysUserApi.page({ current: 1, size: 1 });
    userTotal.value = page.total;
  } catch {
    userTotal.value = null;
    ElMessage.error('仪表盘数据加载失败');
  } finally {
    dashboardLoading.value = false;
  }
}

onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
  void loadDashboard();
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <section v-loading="dashboardLoading" class="dashboard">
    <div class="hero">
      <div>
        <span class="eyebrow">EzShop Console</span>
        <h2>欢迎回来</h2>
        <p>当前令牌有效期会实时刷新，用户规模来自现有分页接口。</p>
      </div>
      <div class="clock">
        <strong>{{ clockText }}</strong>
        <span>GMT+8</span>
      </div>
    </div>

    <div class="stat-grid">
      <article class="stat-card">
        <div class="stat-icon primary">
          <Users :size="20" />
        </div>
        <div>
          <span>系统用户</span>
          <strong>{{ userTotal ?? '-' }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon cyan">
          <Clock3 :size="20" />
        </div>
        <div>
          <span>令牌剩余</span>
          <strong>{{ tokenRemaining }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon success">
          <CircleCheck :size="20" />
        </div>
        <div>
          <span>登录状态</span>
          <strong>{{ authStore.isAuthenticated ? '正常' : '已失效' }}</strong>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon muted">
          <Activity :size="20" />
        </div>
        <div>
          <span>业务模块</span>
          <strong>开发中</strong>
        </div>
      </article>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>后端接口接入状态</h3>
        <p>菜单接口已预留，等待后端返回结构确定后接入侧边栏。</p>
      </div>

      <div class="module-list">
        <div v-for="item in modules" :key="item.title" class="module-row">
          <div>
            <strong>{{ item.title }}</strong>
            <code>{{ item.detail }}</code>
          </div>
          <span class="badge" :class="{ reserved: item.status === '已预留' }">{{
            item.status
          }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 22px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px solid var(--ez-line);
  border-radius: 16px;
  background: radial-gradient(circle at 88% 12%, rgba(56, 102, 242, 0.12), transparent 30%), #fff;
}

.eyebrow {
  color: var(--ez-primary-dark);
  font-size: 13px;
  font-weight: 700;
}

.hero h2 {
  margin: 8px 0 7px;
  font-size: 28px;
}

.hero p {
  max-width: 560px;
  margin: 0;
  color: var(--ez-muted);
}

.clock {
  min-width: 116px;
  padding: 16px;
  border: 1px solid var(--ez-line);
  border-radius: 12px;
  text-align: center;
  background: #f8faff;
}

.clock strong {
  display: block;
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}

.clock span {
  color: var(--ez-muted);
  font-size: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--ez-line);
  border-radius: 12px;
  background: #fff;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
}

.stat-icon.primary {
  color: var(--ez-primary-dark);
  background: #eef3ff;
}

.stat-icon.cyan {
  color: #12707f;
  background: #e4f6f9;
}

.stat-icon.success {
  color: #217b45;
  background: #e7f7ed;
}

.stat-icon.muted {
  color: #5d6880;
  background: #eef0f5;
}

.stat-card span {
  color: var(--ez-muted);
  font-size: 12px;
}

.stat-card strong {
  display: block;
  margin-top: 3px;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.panel {
  padding: 22px;
  border: 1px solid var(--ez-line);
  border-radius: 16px;
  background: #fff;
}

.panel-head h3 {
  margin: 0;
  font-size: 18px;
}

.panel-head p {
  margin: 5px 0 18px;
  color: var(--ez-muted);
  font-size: 13px;
}

.module-list {
  display: grid;
  gap: 10px;
}

.module-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ez-line);
}

.module-row:last-child {
  border-bottom: 0;
}

.module-row strong {
  display: block;
}

.module-row code {
  color: var(--ez-muted);
  font-size: 12px;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  color: #217b45;
  background: #e7f7ed;
  font-size: 12px;
  white-space: nowrap;
}

.badge.reserved {
  color: #8a6116;
  background: #fdf1d9;
}

@media (max-width: 920px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
