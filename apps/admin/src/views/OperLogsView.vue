<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Braces, CircleAlert, Copy, Eye, Globe, Info, RefreshCw, Search, User } from 'lucide-vue-next';
import { sysLogApi } from '@/api/sys-log';
import type {
  OperLogPageItem,
  OperLogPageQuery,
  OperLogStatus,
} from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { usePermissionStore } from '@/stores/permissions';

const logs = ref<OperLogPageItem[]>([]);
const total = ref(0);
const tableLoading = ref(false);
const permissionStore = usePermissionStore();

const canQueryOperLogs = computed(() =>
  permissionStore.hasPermission('sys:log:oper:query'),
);

const detailVisible = ref(false);
const detailLog = ref<OperLogPageItem | null>(null);

const pagination = reactive({
  current: 1,
  size: 10,
});

const filters = reactive({
  module: '',
  operation: '',
  username: '',
  ip: '',
  status: undefined as OperLogStatus | undefined,
  createTimeRange: null as [string, string] | null,
});

function normalizeOptionalStatus(
  value: OperLogStatus | undefined,
): OperLogStatus | undefined {
  return value === 0 || value === 1 ? value : undefined;
}

function normalizeDateRange(value: [string, string] | null): [string, string] | undefined {
  if (!value || value.length !== 2) {
    return undefined;
  }

  const [begin, end] = value;

  return begin && end ? [begin, end] : undefined;
}

function buildParams(): OperLogPageQuery {
  const params: OperLogPageQuery = {
    current: pagination.current,
    size: pagination.size,
  };

  if (filters.module.trim()) {
    params.module = filters.module.trim();
  }

  if (filters.operation.trim()) {
    params.operation = filters.operation.trim();
  }

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
  if (!canQueryOperLogs.value) {
    return;
  }

  tableLoading.value = true;

  try {
    const page = await sysLogApi.operPage(buildParams());
    logs.value = page.records;
    total.value = page.total;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作日志加载失败');
  } finally {
    tableLoading.value = false;
  }
}

async function searchLogs() {
  pagination.current = 1;
  await loadLogs();
}

async function resetFilters() {
  filters.module = '';
  filters.operation = '';
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

function openDetail(row: OperLogPageItem) {
  detailLog.value = row;
  detailVisible.value = true;
}

function formatElapsed(elapsedMs?: number): string {
  return typeof elapsedMs === 'number' ? `${elapsedMs} ms` : '-';
}

function highlightJson(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, text, colon, keyword, num) => {
      if (text) {
        return colon
          ? `<span class="token-key">${text}</span>${colon}`
          : `<span class="token-string">${text}</span>`;
      }

      if (keyword) {
        return `<span class="token-literal">${keyword}</span>`;
      }

      if (num) {
        return `<span class="token-number">${num}</span>`;
      }

      return match;
    },
  );
}

const formattedParamsText = computed(() => {
  const raw = detailLog.value?.requestParams;

  if (!raw) {
    return '-';
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
});

const highlightedParams = computed(() => highlightJson(formattedParamsText.value));

async function copyRequestParams() {
  if (formattedParamsText.value === '-') {
    return;
  }

  try {
    await navigator.clipboard.writeText(formattedParamsText.value);
    ElMessage.success('请求参数已复制');
  } catch {
    ElMessage.error('复制失败，请手动复制');
  }
}

onMounted(() => {
  void loadLogs();
});
</script>

<template>
  <section class="oper-logs-page">
    <div class="panel filter-panel">
      <el-form inline class="filter-form" @submit.prevent="searchLogs">
        <el-form-item label="所属模块">
          <el-input
            v-model="filters.module"
            placeholder="模糊搜索"
            clearable
            maxlength="50"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="操作内容">
          <el-input
            v-model="filters.operation"
            placeholder="模糊搜索"
            clearable
            maxlength="50"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input
            v-model="filters.username"
            placeholder="模糊搜索"
            clearable
            maxlength="64"
            class="filter-input"
          />
        </el-form-item>

        <el-form-item label="操作 IP">
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

        <el-form-item label="操作时间">
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
        <h2>操作日志列表</h2>
      </div>

      <el-table
        v-loading="tableLoading"
        :data="logs"
        row-key="id"
        class="oper-log-table"
      >
        <el-table-column prop="id" label="日志 ID" min-width="190" show-overflow-tooltip />
        <el-table-column prop="module" label="所属模块" min-width="110" show-overflow-tooltip />
        <el-table-column prop="operation" label="操作内容" min-width="130" show-overflow-tooltip />
        <el-table-column
          prop="username"
          label="操作人员"
          min-width="110"
          show-overflow-tooltip
          sortable
        />
        <el-table-column prop="requestMethod" label="请求方式" min-width="90" />
        <el-table-column prop="requestUri" label="请求地址" min-width="240" show-overflow-tooltip />
        <el-table-column prop="ip" label="操作 IP" min-width="130" show-overflow-tooltip />
        <el-table-column
          prop="operLocation"
          label="操作地点"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column label="状态" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="light">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="elapsedMs" label="耗时" min-width="90" sortable>
          <template #default="{ row }">
            {{ formatElapsed(row.elapsedMs) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" min-width="170" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          min-width="110"
          align="center"
          header-align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <button
              class="table-action"
              type="button"
              @click.stop="openDetail(row)"
            >
              <Eye :size="15" />
              <span>详情</span>
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

    <el-drawer v-model="detailVisible" title="操作日志详情" size="480px">
      <div v-if="detailLog" class="detail-body">
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">
              <Info :size="14" />
              基本信息
            </span>
          </div>
          <dl class="detail-list">
            <div>
              <dt>日志 ID</dt>
              <dd>{{ detailLog.id }}</dd>
            </div>
            <div>
              <dt>所属模块</dt>
              <dd>{{ detailLog.module || '-' }}</dd>
            </div>
            <div>
              <dt>操作内容</dt>
              <dd>{{ detailLog.operation || '-' }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>
                <el-tag :type="detailLog.status === 1 ? 'success' : 'danger'" effect="light">
                  {{ detailLog.status === 1 ? '成功' : '失败' }}
                </el-tag>
              </dd>
            </div>
            <div>
              <dt>耗时</dt>
              <dd>{{ formatElapsed(detailLog.elapsedMs) }}</dd>
            </div>
            <div>
              <dt>操作时间</dt>
              <dd>{{ formatDateTime(detailLog.createTime) }}</dd>
            </div>
          </dl>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">
              <User :size="14" />
              操作人员
            </span>
          </div>
          <dl class="detail-list">
            <div>
              <dt>操作人员</dt>
              <dd>{{ detailLog.username || '-' }}</dd>
            </div>
            <div>
              <dt>操作 IP</dt>
              <dd>{{ detailLog.ip || '-' }}</dd>
            </div>
            <div>
              <dt>操作地点</dt>
              <dd>{{ detailLog.operLocation || '-' }}</dd>
            </div>
          </dl>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">
              <Globe :size="14" />
              请求信息
            </span>
          </div>
          <dl class="detail-list">
            <div>
              <dt>请求方式</dt>
              <dd>{{ detailLog.requestMethod || '-' }}</dd>
            </div>
            <div>
              <dt>请求地址</dt>
              <dd class="break-all">{{ detailLog.requestUri || '-' }}</dd>
            </div>
          </dl>
        </div>

        <div v-if="detailLog.status !== 1" class="detail-section">
          <div class="section-header">
            <span class="section-title">
              <CircleAlert :size="14" />
              失败原因
            </span>
          </div>
          <p class="failure-text">{{ detailLog.errorMsg || '-' }}</p>
        </div>

        <div class="detail-section params-section">
          <div class="section-header">
            <span class="section-title">
              <Braces :size="14" />
              请求参数
            </span>
            <button
              v-if="detailLog.requestParams"
              class="copy-button"
              type="button"
              @click="copyRequestParams"
            >
              <Copy :size="14" />
              复制
            </button>
          </div>
          <pre class="params-block" v-html="highlightedParams"></pre>
        </div>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.oper-logs-page {
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

.table-action {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
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

.pagination-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.detail-body {
  display: grid;
  gap: 14px;
}

.detail-list {
  margin: 0;
  padding: 2px 12px;
}

.detail-list div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
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
}

.detail-section {
  border: 1px solid var(--ez-line);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ez-line);
  background: #fbfcff;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.break-all {
  overflow-wrap: anywhere;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--ez-line);
  border-radius: 6px;
  color: var(--ez-primary-dark);
  background: #fff;
  cursor: pointer;
}

.copy-button:hover {
  border-color: rgba(56, 102, 242, 0.38);
  background: #f5f8ff;
}

.params-block {
  margin: 0;
  padding: 12px;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #f7f9ff;
  font-size: 13px;
  line-height: 1.6;
}

.failure-text {
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #d2494a;
  background: #fff5f5;
  font-size: 13px;
  line-height: 1.6;
}

.token-key {
  color: #0550ae;
}

.token-string {
  color: #116329;
}

.token-number {
  color: #8250df;
}

.token-literal {
  color: #953800;
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
