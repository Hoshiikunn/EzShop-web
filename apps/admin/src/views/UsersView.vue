<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Eye, RefreshCw, Search } from 'lucide-vue-next';
import { sysUserApi } from '@/api/sys-user';
import type { UserPageItem, UserInfo, UserPageQuery } from '@/types/api';
import { formatDateTime } from '@/utils/format';

const users = ref<UserPageItem[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const detailLoading = ref(false);
const drawerVisible = ref(false);
const detail = ref<UserInfo | null>(null);

const pagination = reactive({
  current: 1,
  size: 10,
});

const filters = reactive({
  username: '',
  realName: '',
  gender: '',
  mobile: '',
  status: '',
  createTimeRange: [] as string[],
});

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

  if (filters.gender !== '') {
    params.gender = Number(filters.gender) as 0 | 1;
  }

  if (filters.mobile.trim()) {
    params.mobile = filters.mobile.trim();
  }

  if (filters.status !== '') {
    params.status = Number(filters.status) as 0 | 1;
  }

  if (filters.createTimeRange.length === 2) {
    params.createTimeBegin = filters.createTimeRange[0];
    params.createTimeEnd = filters.createTimeRange[1];
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
  filters.gender = '';
  filters.mobile = '';
  filters.status = '';
  filters.createTimeRange = [];
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
            <el-option label="女" value="0" />
            <el-option label="男" value="1" />
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
            <el-option label="禁用" value="0" />
            <el-option label="启用" value="1" />
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
      <el-table
        v-loading="tableLoading"
        :data="users"
        row-key="id"
        class="user-table"
        @row-click="openDetail"
      >
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

.detail-body {
  min-height: 300px;
}

.detail-profile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 20px;
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
