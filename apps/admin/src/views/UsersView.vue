<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type TableInstance } from 'element-plus';
import { Eye, Pencil, RefreshCw, Search, Trash2, UserPlus } from 'lucide-vue-next';
import { sysUserApi } from '@/api/sys-user';
import type {
  UserBatchDeletePayload,
  UserPageItem,
  UserInfo,
  UserPageQuery,
  UserId,
} from '@/types/api';
import { formatDateTime } from '@/utils/format';
import CreateUserDrawer from '@/components/CreateUserDrawer.vue';
import EditUserDrawer from '@/components/EditUserDrawer.vue';

const users = ref<UserPageItem[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const detailLoading = ref(false);
const drawerVisible = ref(false);
const detail = ref<UserInfo | null>(null);
const userTableRef = ref<TableInstance>();
const selectedUsers = ref<UserPageItem[]>([]);
const createUserVisible = ref(false);
const editUserVisible = ref(false);
const editUserId = ref<UserId | null>(null);
const deleting = ref(false);

const selectedCount = computed(() => selectedUsers.value.length);

const batchDeleteDisabled = computed(() => deleting.value || selectedCount.value === 0);

const pagination = reactive({
  current: 1,
  size: 10,
});

const filters = reactive({
  username: '',
  realName: '',
  gender: undefined as 0 | 1 | undefined,
  mobile: '',
  status: undefined as 0 | 1 | undefined,
  createTimeRange: null as [string, string] | null,
});

function normalizeOptionalNumber(value: 0 | 1 | undefined): 0 | 1 | undefined {
  return value === 0 || value === 1 ? value : undefined;
}

function normalizeDateRange(value: [string, string] | null): [string, string] | undefined {
  if (!value || value.length !== 2) {
    return undefined;
  }

  const [begin, end] = value;

  return begin && end ? [begin, end] : undefined;
}

function buildParams(): UserPageQuery {
  const params: UserPageQuery = {
    current: pagination.current,
    size: pagination.size,
  };

  if (filters.username.trim()) {
    params.username = filters.username.trim();
  }

  if (filters.realName.trim()) {
    params.realName = filters.realName.trim();
  }

  const gender = normalizeOptionalNumber(filters.gender);

  if (gender !== undefined) {
    params.gender = gender;
  }

  if (filters.mobile.trim()) {
    params.mobile = filters.mobile.trim();
  }

  const status = normalizeOptionalNumber(filters.status);

  if (status !== undefined) {
    params.status = status;
  }

  const createTimeRange = normalizeDateRange(filters.createTimeRange);

  if (createTimeRange) {
    [params.createTimeBegin, params.createTimeEnd] = createTimeRange;
  }

  return params;
}

async function loadUsers() {
  tableLoading.value = true;

  try {
    const page = await sysUserApi.page(buildParams());
    users.value = page.records;
    total.value = page.total;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户列表加载失败');
  } finally {
    tableLoading.value = false;
  }
}

async function searchUsers() {
  pagination.current = 1;
  await loadUsers();
}

async function resetFilters() {
  filters.username = '';
  filters.realName = '';
  filters.gender = undefined;
  filters.mobile = '';
  filters.status = undefined;
  filters.createTimeRange = null;
  pagination.current = 1;
  await loadUsers();
}

function handleSizeChange(size: number) {
  pagination.size = size;
  pagination.current = 1;
  void loadUsers();
}

function handleCurrentChange(current: number) {
  pagination.current = current;
  void loadUsers();
}

async function openDetail(row: UserPageItem) {
  drawerVisible.value = true;
  detailLoading.value = true;

  try {
    detail.value = await sysUserApi.info(row.id);
  } catch (error) {
    detail.value = null;
    drawerVisible.value = false;
    ElMessage.error(error instanceof Error ? error.message : '用户详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

function openEditor(userId: UserId) {
  editUserId.value = userId;
  editUserVisible.value = true;
}

async function handleUserUpdated(userId: UserId) {
  await loadUsers();

  if (drawerVisible.value && detail.value?.id === userId) {
    try {
      detail.value = await sysUserApi.info(userId);
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '用户详情刷新失败');
    }
  }
}

function handleSelectionChange(rows: UserPageItem[]) {
  selectedUsers.value = rows;
}

function buildDeleteConfirmMessage(users: UserPageItem[]): string {
  if (users.length === 1) {
    const user = users[0];

    return `确定要删除用户「${user.realName || user.username}」吗？删除后不可从本系统恢复。`;
  }

  const previewNames = users
    .slice(0, 3)
    .map((user) => user.realName || user.username)
    .join('、');

  return `确定要删除 ${previewNames} 等 ${users.length} 个用户吗？删除后不可从本系统恢复。`;
}

async function confirmDeleteUsers(users: UserPageItem[]) {
  const ids = users.map((user) => user.id);

  if (ids.length === 0) {
    ElMessage.warning('请选择要删除的用户');
    return;
  }

  if (ids.length > 100) {
    ElMessage.warning('单次最多删除 100 个用户');
    return;
  }

  try {
    await ElMessageBox.confirm(buildDeleteConfirmMessage(users), '删除用户', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  deleting.value = true;

  try {
    await sysUserApi.batchDelete({ ids });
    ElMessage.success(ids.length === 1 ? '用户已删除' : `已删除 ${ids.length} 个用户`);

    const deletedIds = new Set(ids);

    if (detail.value && deletedIds.has(detail.value.id)) {
      drawerVisible.value = false;
      detail.value = null;
    }

    userTableRef.value?.clearSelection();
    await loadUsers();

    const pageCount = Math.max(1, Math.ceil(total.value / pagination.size));

    if (pagination.current > pageCount) {
      pagination.current = pageCount;
      await loadUsers();
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户删除失败');
  } finally {
    deleting.value = false;
  }
}

onMounted(loadUsers);
</script>

<template>
  <section class="users-page">
    <div class="panel filter-panel">
      <el-form inline class="filter-form" @submit.prevent="searchUsers">
        <el-form-item label="用户名">
          <el-input
            v-model="filters.username"
            placeholder="模糊搜索"
            clearable
            maxlength="20"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="真实姓名">
          <el-input
            v-model="filters.realName"
            placeholder="模糊搜索"
            clearable
            maxlength="32"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="性别">
          <el-select v-model="filters.gender" placeholder="全部" clearable class="filter-select">
            <el-option label="女" :value="0" />
            <el-option label="男" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="filters.mobile"
            placeholder="精确匹配"
            clearable
            maxlength="11"
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
        <h2>用户列表</h2>
        <div class="header-actions">
          <button
            class="danger-button"
            type="button"
            :disabled="batchDeleteDisabled"
            @click="confirmDeleteUsers([...selectedUsers])"
          >
            <Trash2 :size="16" />
            删除所选{{ selectedCount ? `（${selectedCount}）` : '' }}
          </button>
          <button class="create-button" type="button" @click="createUserVisible = true">
            <UserPlus :size="16" />
            添加用户
          </button>
        </div>
      </div>

      <el-table
        ref="userTableRef"
        v-loading="tableLoading"
        :data="users"
        row-key="id"
        class="user-table"
        @selection-change="handleSelectionChange"
        @row-click="openDetail"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="id" label="ID" min-width="90" />
        <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
        <el-table-column prop="realName" label="真实姓名" min-width="130" show-overflow-tooltip />
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="mobile" label="手机号" min-width="130" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <button class="table-action" type="button" @click.stop="openDetail(row)">
              <Eye :size="15" />
              详情
            </button>
            <button class="table-action" type="button" @click.stop="openEditor(row.id)">
              <Pencil :size="15" />
              编辑
            </button>
            <button
              class="table-action delete-action"
              type="button"
              :disabled="deleting"
              @click.stop="confirmDeleteUsers([row])"
            >
              <Trash2 :size="15" />
              删除
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

    <el-drawer v-model="drawerVisible" title="用户详情" size="420px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-profile">
            <div class="avatar">
              {{ detail.username.slice(0, 1).toUpperCase() }}
            </div>
            <div>
              <strong>{{ detail.realName || detail.username }}</strong>
              <span>{{ detail.username }}</span>
            </div>
            <button class="detail-edit-button" type="button" @click="openEditor(detail.id)">
              <Pencil :size="15" />
              编辑
            </button>
            <button
              class="detail-delete-button"
              type="button"
              :disabled="deleting"
              @click="confirmDeleteUsers([detail])"
            >
              <Trash2 :size="15" />
              删除
            </button>
          </div>

          <dl class="detail-list">
            <div>
              <dt>用户 ID</dt>
              <dd>{{ detail.id }}</dd>
            </div>
            <div>
              <dt>性别</dt>
              <dd>{{ detail.gender === 1 ? '男' : '女' }}</dd>
            </div>
            <div>
              <dt>手机号</dt>
              <dd>{{ detail.mobile || '-' }}</dd>
            </div>
            <div>
              <dt>邮箱</dt>
              <dd>{{ detail.email || '-' }}</dd>
            </div>
            <div>
              <dt>账号状态</dt>
              <dd>{{ detail.status === 1 ? '启用' : '禁用' }}</dd>
            </div>
            <div>
              <dt>超级管理员</dt>
              <dd>{{ detail.isSuperAdmin === 1 ? '是' : '否' }}</dd>
            </div>
            <div>
              <dt>最后登录 IP</dt>
              <dd>{{ detail.lastLoginIp || '-' }}</dd>
            </div>
            <div>
              <dt>最后登录时间</dt>
              <dd>{{ formatDateTime(detail.lastLoginTime) }}</dd>
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

    <CreateUserDrawer v-model="createUserVisible" @created="loadUsers" />
    <EditUserDrawer v-model="editUserVisible" :user-id="editUserId" @updated="handleUserUpdated" />
  </section>
</template>

<style scoped>
.users-page {
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
    border-color 0.2s ease;
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
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.create-button:hover {
  border-color: var(--ez-primary-dark);
  background: var(--ez-primary-dark);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.danger-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 13px;
  border: 1px solid rgba(210, 73, 74, 0.36);
  border-radius: 7px;
  color: #d2494a;
  background: #fff;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.danger-button:hover:not(:disabled) {
  color: #fff;
  border-color: #d2494a;
  background: #d2494a;
}

.danger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-table {
  width: 100%;
}

.user-table :deep(tbody tr) {
  cursor: pointer;
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

.table-action.delete-action {
  color: #d2494a;
}

.table-action.delete-action:hover:not(:disabled) {
  border-color: rgba(210, 73, 74, 0.38);
  color: #d2494a;
  background: #fff5f5;
}

.table-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.table-action + .table-action {
  margin-left: 8px;
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

.detail-edit-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  margin-left: auto;
  padding: 0 10px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: var(--ez-primary-dark);
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.detail-edit-button:hover {
  border-color: rgba(56, 102, 242, 0.38);
  background: #f5f8ff;
}

.detail-delete-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(210, 73, 74, 0.36);
  border-radius: 7px;
  color: #d2494a;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.detail-delete-button:hover:not(:disabled) {
  border-color: #d2494a;
  background: #fff5f5;
}

.detail-delete-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.avatar {
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
