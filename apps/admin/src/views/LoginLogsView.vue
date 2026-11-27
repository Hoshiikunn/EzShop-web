<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type TableInstance } from 'element-plus';
import { RefreshCw, Search } from 'lucide-vue-next';
import { sysLogApi } from '@/api/sys-log';
import type {
  LoginLogPageItem,
  LoginLogPageQuery,
  LoginLogStatus,
} from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { usePermissionStore } from '@/stores/permissions';
import { useTableColumns } from '@/composables/use-table-columns';

const logs = ref<LoginLogPageItem[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const tableRef = ref<TableInstance>();
const permissionStore = usePermissionStore();

const { columnWidths, handleHeaderDragend } = useTableColumns(
  [
    { label: '日志 ID', width: 200, minWidth: 150 },
    { label: '用户名', width: 140, minWidth: 80 },
    { label: '登录 IP', width: 140, minWidth: 90 },
    { label: '登录地点', width: 160, minWidth: 90 },
    { label: '操作系统', width: 120, minWidth: 80 },
    { label: '浏览器', width: 120, minWidth: 80 },
    { label: '状态', width: 90, minWidth: 70 },
    { label: '结果描述', width: 180, minWidth: 100 },
    { label: '登录时间', width: 180, minWidth: 140 },
  ],
  tableRef,
);

const canQueryLoginLogs = computed(() =>
  permissionStore.hasPermission('sys:log:login:query'),
);

const pagination = reactive({
  current: 1,
  size: 10,
});

const filters = reactive({
  username: '',
  ip: '',
  status: undefined as LoginLogStatus | undefined,
  createTimeRange: null as [string, string] | null,
});

function normalizeOptionalStatus(
  value: LoginLogStatus | undefined,
): LoginLogStatus | undefined {
  return value === 0 || value === 1 ? value : undefined;
}

function normalizeDateRange(value: [string, string] | null): [string, string] | undefined {
  if (!value || value.length !== 2) {
    return undefined;
  }

  const [begin, end] = value;

  return begin && end ? [begin, end] : undefined;
}

function buildParams(): LoginLogPageQuery {
  const params: LoginLogPageQuery = {
    current: pagination.current,
    size: pagination.size,
  };

  if (filters.username.trim()) {
    params.username = filters.username.trim();
  }

  if (filters.ip.trim()) {
    params.ip = filters.ip.trim();
  }

  const status = normalizeOptionalStatus(filters.status);

  if (status !== undefined) {
    params.status = status;
  }

  const createTimeRange = normalizeDateRange(filters.createTimeRange);

  if (createTimeRange) {
    [params.createTimeBegin, params.createTimeEnd] = createTimeRange;
  }

  return params;
}

async function loadLogs() {
  if (!canQueryLoginLogs.value) {
    return;
  }

  tableLoading.value = true;

  try {
    const page = await sysLogApi.loginPage(buildParams());
    logs.value = page.records;
    total.value = page.total;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录日志加载失败');
  } finally {
    tableLoading.value = false;
  }
}

async function searchLogs() {
  pagination.current = 1;
  await loadLogs();
}

async function resetFilters() {
  filters.username = '';
  filters.ip = '';
  filters.status = undefined;
  filters.createTimeRange = null;
  pagination.current = 1;
  await loadLogs();
}

function handleSizeChange(size: number) {
  pagination.size = size;
  pagination.current = 1;
  void loadLogs();
}

function handleCurrentChange(current: number) {
  pagination.current = current;
  void loadLogs();
}

onMounted(() => {
  void loadLogs();
});
</script>

<template>
  <section class="login-logs-page">
    <div class="panel filter-panel">
      <el-form inline class="filter-form" @submit.prevent="searchLogs">
        <el-form-item label="用户名">
          <el-input
            v-model="filters.username"
            placeholder="模糊搜索"
            clearable
            maxlength="64"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="登录 IP">
          <el-input
            v-model="filters.ip"
            placeholder="精确匹配"
            clearable
            maxlength="45"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable class="filter-select">
            <el-option label="失败" :value="0" />
            <el-option label="成功" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item label="登录时间">
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
        <h2>登录日志列表</h2>
      </div>

      <el-table
        ref="tableRef"
        v-loading="tableLoading"
        :data="logs"
        row-key="id"
        class="login-log-table"
        border
        @header-dragend="handleHeaderDragend"
      >
        <el-table-column prop="id" label="日志 ID" :width="columnWidths['日志 ID']" show-overflow-tooltip />
        <el-table-column
          prop="username"
          label="用户名"
          :width="columnWidths['用户名']"
          show-overflow-tooltip
          sortable
        />
        <el-table-column prop="ip" label="登录 IP" :width="columnWidths['登录 IP']" show-overflow-tooltip />
        <el-table-column
          prop="loginLocation"
          label="登录地点"
          :width="columnWidths['登录地点']"
          show-overflow-tooltip
        />
        <el-table-column
          prop="os"
          label="操作系统"
          :width="columnWidths['操作系统']"
          show-overflow-tooltip
        />
        <el-table-column
          prop="browser"
          label="浏览器"
          :width="columnWidths['浏览器']"
          show-overflow-tooltip
        />
        <el-table-column label="状态" :width="columnWidths['状态']">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="message"
          label="结果描述"
          :width="columnWidths['结果描述']"
          show-overflow-tooltip
        />
        <el-table-column
          prop="createTime"
          label="登录时间"
          :width="columnWidths['登录时间']"
          sortable
        >
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
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
  </section>
</template>

<style scoped>
.login-logs-page {
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

.pagination-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
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
