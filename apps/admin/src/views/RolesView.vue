<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Eye, ListTree, Plus, RefreshCw, Search } from 'lucide-vue-next';
import { sysRoleApi } from '@/api/sys-role';
import { sysMenuApi } from '@/api/sys-menu';
import type {
  MenuId,
  MenuTreeNode,
  MenuType,
  RolePageItem,
  RoleInfo,
  RolePageQuery,
} from '@/types/api';
import { formatDateTime } from '@/utils/format';
import AddRoleDrawer from '@/components/AddRoleDrawer.vue';

const roles = ref<RolePageItem[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const detailLoading = ref(false);
const drawerVisible = ref(false);
const detail = ref<RoleInfo | null>(null);
const menuTree = ref<MenuTreeNode[]>([]);
const addRoleVisible = ref(false);

const menuTreeProps = {
  label: 'menuName',
  children: 'children',
};

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

const selectedMenuCount = computed(() => detail.value?.menuIds?.length ?? 0);

const selectedMenuTree = computed(() =>
  filterMenuTree(menuTree.value, new Set(detail.value?.menuIds ?? [])),
);

let detailRequestToken = 0;

const pagination = reactive({
  current: 1,
  size: 10,
});

const filters = reactive({
  roleName: '',
  roleKey: '',
  status: undefined as 0 | 1 | undefined,
  createTimeRange: null as [string, string] | null,
});

function normalizeDateRange(value: [string, string] | null): [string, string] | undefined {
  if (!value || value.length !== 2) {
    return undefined;
  }

  const [begin, end] = value;

  return begin && end ? [begin, end] : undefined;
}

function buildParams(): RolePageQuery {
  const params: RolePageQuery = {
    current: pagination.current,
    size: pagination.size,
  };

  if (filters.roleName.trim()) {
    params.roleName = filters.roleName.trim();
  }

  if (filters.roleKey.trim()) {
    params.roleKey = filters.roleKey.trim();
  }

  if (filters.status !== undefined) {
    params.status = filters.status;
  }

  const createTimeRange = normalizeDateRange(filters.createTimeRange);

  if (createTimeRange) {
    [params.createTimeBegin, params.createTimeEnd] = createTimeRange;
  }

  return params;
}

async function loadRoles() {
  tableLoading.value = true;

  try {
    const page = await sysRoleApi.page(buildParams());
    roles.value = page.records;
    total.value = page.total;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色列表加载失败');
  } finally {
    tableLoading.value = false;
  }
}

async function searchRoles() {
  pagination.current = 1;
  await loadRoles();
}

async function resetFilters() {
  filters.roleName = '';
  filters.roleKey = '';
  filters.status = undefined;
  filters.createTimeRange = null;
  pagination.current = 1;
  await loadRoles();
}

function handleSizeChange(size: number) {
  pagination.size = size;
  pagination.current = 1;
  void loadRoles();
}

function handleCurrentChange(current: number) {
  pagination.current = current;
  void loadRoles();
}

async function openDetail(row: RolePageItem) {
  const requestToken = ++detailRequestToken;
  drawerVisible.value = true;
  detailLoading.value = true;

  try {
    const [roleInfo, menuTreeData] = await Promise.all([
      sysRoleApi.info(row.id),
      sysMenuApi.tree(),
    ]);

    if (requestToken !== detailRequestToken) {
      return;
    }

    detail.value = roleInfo;
    menuTree.value = menuTreeData;
  } catch (error) {
    if (requestToken !== detailRequestToken) {
      return;
    }

    detail.value = null;
    drawerVisible.value = false;
    ElMessage.error(error instanceof Error ? error.message : '角色详情加载失败');
  } finally {
    if (requestToken === detailRequestToken) {
      detailLoading.value = false;
    }
  }
}

function filterMenuTree(nodes: MenuTreeNode[], menuIds: Set<MenuId>): MenuTreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterMenuTree(node.children ?? [], menuIds);

    if (!menuIds.has(node.id) && children.length === 0) {
      return [];
    }

    return [{ ...node, children }];
  });
}

onMounted(loadRoles);
</script>

<template>
  <section class="roles-page">
    <div class="panel filter-panel">
      <el-form inline class="filter-form" @submit.prevent="searchRoles">
        <el-form-item label="角色名称">
          <el-input
            v-model="filters.roleName"
            placeholder="模糊搜索"
            clearable
            maxlength="30"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="角色权限字符">
          <el-input
            v-model="filters.roleKey"
            placeholder="模糊搜索"
            clearable
            maxlength="100"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable class="filter-select">
            <el-option label="禁用" :value="0" />
            <el-option label="启用" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filters.createTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item>
          <button class="action-button primary" type="submit">
            <Search :size="16" />
            查询
          </button>
          <button class="action-button" type="button" @click="resetFilters">
            <RefreshCw :size="16" />
            重置
          </button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel table-panel">
      <div class="table-header">
        <h2>角色列表</h2>
        <button class="create-button" type="button" @click="addRoleVisible = true">
          <Plus :size="16" />
          添加角色
        </button>
      </div>

      <el-table
        v-loading="tableLoading"
        :data="roles"
        row-key="id"
        class="role-table"
        @row-click="openDetail"
      >
        <el-table-column prop="id" label="ID" min-width="90" />
        <el-table-column prop="roleName" label="角色名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="roleKey" label="角色权限字符" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="role-key">{{ row.roleKey }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <button class="table-action" type="button" @click.stop="openDetail(row)">
              <Eye :size="15" />
              详情
            </button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-drawer v-model="drawerVisible" title="角色详情" size="480px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-profile">
            <div class="detail-avatar">
              {{ detail.roleName.slice(0, 1).toUpperCase() }}
            </div>
            <div>
              <strong>{{ detail.roleName }}</strong>
              <span>{{ detail.roleKey }}</span>
            </div>
          </div>

          <dl class="detail-list">
            <div>
              <dt>角色 ID</dt>
              <dd>{{ detail.id }}</dd>
            </div>
            <div>
              <dt>角色权限字符</dt>
              <dd>{{ detail.roleKey }}</dd>
            </div>
            <div>
              <dt>排序</dt>
              <dd>{{ detail.sort ?? '-' }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ detail.status === 1 ? '启用' : '禁用' }}</dd>
            </div>
            <div>
              <dt>备注</dt>
              <dd>{{ detail.remark || '-' }}</dd>
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

          <div class="permission-panel">
            <div class="permission-head">
              <ListTree :size="16" />
              <strong>菜单权限</strong>
              <span class="permission-count">{{ selectedMenuCount }} 项</span>
            </div>
            <el-tree
              class="permission-tree"
              :data="selectedMenuTree"
              node-key="id"
              :props="menuTreeProps"
              default-expand-all
              :expand-on-click-node="false"
              empty-text="暂未绑定菜单权限"
            >
              <template #default="{ data }">
                <div class="menu-node">
                  <span class="menu-name">{{ data.menuName }}</span>
                  <el-tag
                    class="menu-type"
                    size="small"
                    effect="light"
                    :type="getMenuTypeTagType(data.menuType)"
                  >
                    {{ getMenuTypeLabel(data.menuType) }}
                  </el-tag>
                </div>
              </template>
            </el-tree>
          </div>
        </template>
      </div>
    </el-drawer>

    <AddRoleDrawer v-model="addRoleVisible" @created="loadRoles" />
  </section>
</template>

<style scoped>
.roles-page {
  display: grid;
  gap: 18px;
}

.panel {
  border: 1px solid var(--ez-line);
  border-radius: 14px;
  background: #fff;
}

.filter-panel {
  padding: 20px 20px 2px;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.filter-input {
  width: 190px;
}

.filter-select {
  width: 130px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 13px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: #5b6780;
  background: #fff;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.action-button.primary {
  margin-right: 8px;
  color: #fff;
  border-color: var(--ez-primary);
  background: var(--ez-primary);
}

.action-button:hover {
  color: var(--ez-primary-dark);
  border-color: rgba(56, 102, 242, 0.45);
}

.action-button.primary:hover {
  color: #fff;
  background: var(--ez-primary-dark);
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

.role-table {
  width: 100%;
}

.role-table :deep(tbody tr) {
  cursor: pointer;
}

.role-key {
  padding: 3px 7px;
  border-radius: 5px;
  color: var(--ez-primary-dark);
  background: #f0f4ff;
  font-size: 12px;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
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
}

.table-action:hover {
  border-color: rgba(56, 102, 242, 0.38);
  background: #f5f8ff;
}

.detail-body {
  min-height: 420px;
}

.detail-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
}

.detail-avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: #fff;
  background: var(--ez-primary);
  font-size: 20px;
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

.permission-panel {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--ez-line);
  border-radius: 12px;
  background: #f8faff;
}

.permission-head {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ez-primary-dark);
}

.permission-count {
  margin-left: auto;
  color: var(--ez-muted);
  font-size: 12px;
}

.permission-tree {
  margin-top: 12px;
  padding-right: 4px;
  max-height: 300px;
  overflow: auto;
}

.permission-tree :deep(.el-tree-node__content) {
  height: 32px;
  border-radius: 7px;
}

.menu-node {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding-right: 4px;
}

.menu-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-type {
  flex-shrink: 0;
}

@media (max-width: 760px) {
  .filter-input,
  .filter-select {
    width: 100%;
  }

  .pagination-row {
    justify-content: center;
  }
}
</style>
