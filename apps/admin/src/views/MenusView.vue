<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Eye } from 'lucide-vue-next';
import { sysMenuApi } from '@/api/sys-menu';
import type { MenuInfo, MenuItem, MenuType } from '@/types/api';
import { formatDateTime } from '@/utils/format';

const menus = ref<MenuItem[]>([]);
const tableLoading = ref(false);
const drawerVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MenuInfo | null>(null);

const menuTypeLabels: Record<MenuType, string> = {
  M: '目录',
  C: '菜单',
  F: '按钮',
};

const menuTypeTagTypes: Record<MenuType, 'primary' | 'success' | 'warning'> = {
  M: 'primary',
  C: 'success',
  F: 'warning',
};

function getMenuTypeLabel(menuType: string): string {
  return menuTypeLabels[menuType as MenuType] ?? '未知';
}

function getMenuTypeTagType(menuType: string): 'primary' | 'success' | 'warning' {
  return menuTypeTagTypes[menuType as MenuType] ?? 'primary';
}

interface MenuTreeItem extends MenuItem {
  children?: MenuTreeItem[];
}

const menuTree = computed(() => buildMenuTree(menus.value));

const menuNameById = computed(() => {
  const nameById = new Map<string, string>();

  for (const menu of menus.value) {
    nameById.set(menu.id, menu.menuName);
  }

  return nameById;
});

function buildMenuTree(items: MenuItem[]): MenuTreeItem[] {
  const nodes = new Map<string, MenuTreeItem>();

  for (const item of items) {
    nodes.set(item.id, { ...item, children: [] });
  }

  const roots: MenuTreeItem[] = [];

  for (const node of nodes.values()) {
    const parent = nodes.get(node.pid);

    if (parent) {
      parent.children?.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodes.values()) {
    if (node.children?.length === 0) {
      delete node.children;
    }
  }

  return roots;
}

async function loadMenus() {
  tableLoading.value = true;

  try {
    menus.value = await sysMenuApi.list();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '菜单列表加载失败');
  } finally {
    tableLoading.value = false;
  }
}

async function openDetail(row: MenuItem) {
  drawerVisible.value = true;
  detailLoading.value = true;

  try {
    detail.value = await sysMenuApi.info(row.id);
  } catch (error) {
    detail.value = null;
    drawerVisible.value = false;
    ElMessage.error(error instanceof Error ? error.message : '菜单详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

onMounted(loadMenus);
</script>

<template>
  <section class="menus-page">
    <div class="panel table-panel">
      <div class="table-header">
        <h2>菜单列表</h2>
      </div>

      <el-table
        v-loading="tableLoading"
        :data="menuTree"
        row-key="id"
        class="menu-table"
        default-expand-all
        :tree-props="{ children: 'children' }"
        @row-click="openDetail"
      >
        <template #empty>
          <el-empty description="暂无菜单" :image-size="72" />
        </template>
        <el-table-column prop="menuName" label="菜单名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="菜单类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="getMenuTypeTagType(row.menuType)">
              {{ getMenuTypeLabel(row.menuType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由地址" min-width="140" show-overflow-tooltip />
        <el-table-column prop="perms" label="权限标识" min-width="170" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="可见性" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible === 0 ? 'info' : 'primary'" effect="light">
              {{ row.visible === 0 ? '隐藏' : '显示' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="120"
          align="center"
          header-align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <button class="table-action" type="button" @click.stop="openDetail(row)">
              <Eye :size="15" />
              <span>详情</span>
            </button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="菜单详情" size="480px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-profile">
            <div class="detail-avatar">
              {{ detail.menuName.slice(0, 1) }}
            </div>
            <div>
              <strong>{{ detail.menuName }}</strong>
              <span>{{ getMenuTypeLabel(detail.menuType) }}</span>
            </div>
          </div>

          <dl class="detail-list">
            <div>
              <dt>菜单 ID</dt>
              <dd>{{ detail.id }}</dd>
            </div>
            <div>
              <dt>父菜单</dt>
              <dd>{{ menuNameById.get(detail.pid) ?? '-' }}</dd>
            </div>
            <div>
              <dt>菜单名称</dt>
              <dd>{{ detail.menuName }}</dd>
            </div>
            <div>
              <dt>菜单类型</dt>
              <dd>{{ getMenuTypeLabel(detail.menuType) }}</dd>
            </div>
            <div>
              <dt>路由地址</dt>
              <dd>{{ detail.path || '-' }}</dd>
            </div>
            <div>
              <dt>组件路径</dt>
              <dd>{{ detail.component || '-' }}</dd>
            </div>
            <div>
              <dt>权限标识</dt>
              <dd>{{ detail.perms || '-' }}</dd>
            </div>
            <div>
              <dt>图标</dt>
              <dd>{{ detail.icon || '-' }}</dd>
            </div>
            <div>
              <dt>排序</dt>
              <dd>{{ detail.sort ?? '-' }}</dd>
            </div>
            <div>
              <dt>可见性</dt>
              <dd>{{ detail.visible === 0 ? '隐藏' : '显示' }}</dd>
            </div>
            <div>
              <dt>打开方式</dt>
              <dd>{{ detail.openStyle === 1 ? '外部' : '内部' }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ detail.status === 1 ? '启用' : '禁用' }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatDateTime(detail.createTime) }}</dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{{ formatDateTime(detail.updateTime) }}</dd>
            </div>
          </dl>
        </template>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.menus-page {
  display: grid;
  gap: 18px;
}

.panel {
  border: 1px solid var(--ez-line);
  border-radius: 14px;
  background: #fff;
}

.table-panel {
  padding: 8px 20px 20px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
}

.table-header h2 {
  margin: 0;
  font-size: 18px;
}

.menu-table {
  width: 100%;
}

.menu-table :deep(tbody tr) {
  cursor: pointer;
}

.table-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 9px;
  border: 1px solid var(--ez-line);
  border-radius: 6px;
  color: var(--ez-primary-dark);
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.table-action:hover {
  border-color: rgba(56, 102, 242, 0.38);
  background: #f5f8ff;
}

.detail-body {
  min-height: 300px;
}

.detail-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
}

.detail-profile > div {
  min-width: 0;
}

.detail-avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: #fff;
  background: var(--ez-primary);
  font-size: 21px;
  font-weight: 800;
}

.detail-profile strong {
  display: block;
}

.detail-profile span {
  color: var(--ez-muted);
  font-size: 13px;
}

.detail-list {
  display: grid;
  gap: 0;
  margin: 0;
}

.detail-list div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ez-line);
}

.detail-list div:last-child {
  border-bottom: 0;
}

.detail-list dt {
  color: var(--ez-muted);
}

.detail-list dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
