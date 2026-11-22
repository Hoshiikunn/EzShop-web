<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { sysMenuApi } from '@/api/sys-menu';
import type { MenuId, MenuInfo, MenuItem } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { loadMenuIconOptions, resolveMenuIcon } from '@/utils/menu-icons';
import { getMenuTypeLabel, getMenuTypeTagType } from '@/utils/menu-types';
import AddMenuDrawer from '@/components/AddMenuDrawer.vue';
import EditMenuDrawer from '@/components/EditMenuDrawer.vue';

const menus = ref<MenuItem[]>([]);
const tableLoading = ref(false);
const drawerVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MenuInfo | null>(null);
const addMenuVisible = ref(false);
const editMenuVisible = ref(false);
const editMenuId = ref<MenuId | null>(null);
const deletingMenuId = ref<MenuId | null>(null);

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

function formatMenuVisible(menu: MenuItem | MenuInfo): string {
  if (menu.menuType === 'F' || menu.visible === undefined) {
    return '-';
  }

  return menu.visible === 0 ? '隐藏' : '显示';
}

function formatMenuOpenStyle(menu: MenuInfo): string {
  if (menu.menuType !== 'C' || menu.openStyle === undefined) {
    return '-';
  }

  return menu.openStyle === 1 ? '外部' : '内部';
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

function openEditor(menuId: MenuId) {
  editMenuId.value = menuId;
  editMenuVisible.value = true;
}

async function handleMenuUpdated(menuId: MenuId) {
  await loadMenus();

  if (drawerVisible.value && detail.value?.id === menuId) {
    try {
      detail.value = await sysMenuApi.info(menuId);
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '菜单详情刷新失败');
    }
  }
}

async function deleteMenu(menu: MenuItem | MenuInfo) {
  if (deletingMenuId.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除菜单「${menu.menuName}」吗？删除后不可恢复，已绑定角色的授权将同步解除。`,
      '删除菜单',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  deletingMenuId.value = menu.id;

  try {
    await sysMenuApi.remove(menu.id);
    ElMessage.success('菜单已删除');

    if (drawerVisible.value && detail.value?.id === menu.id) {
      drawerVisible.value = false;
      detail.value = null;
    }

    await loadMenus();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '菜单删除失败');
  } finally {
    deletingMenuId.value = null;
  }
}

onMounted(() => {
  void loadMenus();
  void loadMenuIconOptions().catch(() => undefined);
});
</script>

<template>
  <section class="menus-page">
    <div class="panel table-panel">
      <div class="table-header">
        <h2>菜单列表</h2>
        <div class="header-actions">
          <button class="create-button" type="button" @click="addMenuVisible = true">
            <Plus :size="16" />
            添加菜单
          </button>
        </div>
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
        <el-table-column label="菜单名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="menu-name-cell">
              <component
                :is="resolveMenuIcon(row.icon)"
                v-if="row.menuType !== 'F' && resolveMenuIcon(row.icon)"
                :size="15"
              />
              {{ row.menuName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="菜单类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="getMenuTypeTagType(row.menuType)">
              {{ getMenuTypeLabel(row.menuType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="路由地址" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.path || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="权限标识" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.perms || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="可见性" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.visible !== undefined && row.menuType !== 'F'"
              :type="row.visible === 0 ? 'info' : 'primary'"
              effect="light"
            >
              {{ row.visible === 0 ? '隐藏' : '显示' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="240"
          align="center"
          header-align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="action-grid">
              <button class="table-action" type="button" @click.stop="openDetail(row)">
                <Eye :size="15" />
                <span>详情</span>
              </button>
              <button class="table-action" type="button" @click.stop="openEditor(row.id)">
                <Pencil :size="15" />
                <span>编辑</span>
              </button>
              <button
                class="table-action delete-action"
                type="button"
                :disabled="deletingMenuId === row.id"
                @click.stop="deleteMenu(row)"
              >
                <Trash2 :size="15" />
                <span>删除</span>
              </button>
            </div>
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

          <div class="detail-actions">
            <button class="detail-action-button" type="button" @click="openEditor(detail.id)">
              <Pencil :size="15" />
              编辑
            </button>
            <button
              class="detail-action-button delete-action"
              type="button"
              :disabled="deletingMenuId === detail.id"
              @click="deleteMenu(detail)"
            >
              <Trash2 :size="15" />
              删除
            </button>
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
              <dd>
                <span
                  v-if="detail.menuType !== 'F' && detail.icon"
                  class="icon-display"
                >
                  <component
                    :is="resolveMenuIcon(detail.icon)"
                    v-if="resolveMenuIcon(detail.icon)"
                    :size="16"
                  />
                  <span>{{ detail.icon }}</span>
                </span>
                <span v-else>-</span>
              </dd>
            </div>
            <div>
              <dt>排序</dt>
              <dd>{{ detail.sort ?? '-' }}</dd>
            </div>
            <div v-if="detail.menuType !== 'F'">
              <dt>可见性</dt>
              <dd>{{ formatMenuVisible(detail) }}</dd>
            </div>
            <div v-if="detail.menuType === 'C'">
              <dt>打开方式</dt>
              <dd>{{ formatMenuOpenStyle(detail) }}</dd>
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

    <AddMenuDrawer v-model="addMenuVisible" @created="loadMenus" />
    <EditMenuDrawer v-model="editMenuVisible" :menu-id="editMenuId" @updated="handleMenuUpdated" />
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 13px;
  border: 1px solid var(--ez-primary);
  border-radius: 7px;
  color: #fff;
  background: var(--ez-primary);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.create-button:hover {
  border-color: var(--ez-primary-dark);
  background: var(--ez-primary-dark);
}

.menu-table {
  width: 100%;
}

.menu-table :deep(tbody tr) {
  cursor: pointer;
}

.action-grid {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.menu-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.icon-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ez-ink);
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

.table-action.delete-action {
  color: #d2494a;
}

.table-action.delete-action:hover:not(:disabled) {
  border-color: rgba(210, 73, 74, 0.38);
  background: #fff5f5;
}

.table-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.detail-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 18px;
}

.detail-action-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: var(--ez-primary-dark);
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.detail-action-button.delete-action {
  color: #d2494a;
}

.detail-action-button.delete-action:hover:not(:disabled) {
  border-color: rgba(210, 73, 74, 0.38);
  background: #fff5f5;
}

.detail-action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
