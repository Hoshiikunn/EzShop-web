<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules, type TreeInstance } from 'element-plus';
import { sysRoleApi } from '@/api/sys-role';
import { sysMenuApi } from '@/api/sys-menu';
import type { MenuTreeNode, MenuType, RoleUpdatePayload } from '@/types/api';

const props = defineProps<{
  roleId: string | null;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  updated: [roleId: string];
}>();

const formRef = ref<FormInstance>();
const roleKey = ref('');
const menuTreeRef = ref<TreeInstance>();
const loading = ref(false);
const submitting = ref(false);
const menuTree = ref<MenuTreeNode[]>([]);
const menuTreeLoaded = ref(false);
let menuTreeToken = 0;
let loadRoleToken = 0;

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

const form = reactive<RoleUpdatePayload>({
  id: '',
  roleName: '',
  sort: 0,
  remark: '',
  menuIds: [],
});

const rules: FormRules<RoleUpdatePayload> = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 30, message: '角色名称长度不可超过 30 字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  remark: [{ max: 255, message: '备注长度不可超过 255 字符', trigger: 'blur' }],
};

function getLeafCheckedKeys(nodes: MenuTreeNode[], selectedIds: Set<string>): string[] {
  return nodes.flatMap((node) => {
    if (!node.children?.length) {
      return selectedIds.has(node.id) ? [node.id] : [];
    }

    return getLeafCheckedKeys(node.children, selectedIds);
  });
}

function resetForm() {
  form.id = '';
  form.roleName = '';
  form.sort = 0;
  form.remark = '';
  form.menuIds = [];

  void nextTick(() => {
    menuTreeRef.value?.setCheckedKeys([]);
    formRef.value?.clearValidate();
  });
}

function fillForm(role: {
  id: string;
  roleKey: string;
  roleName: string;
  sort?: number;
  remark?: string;
  menuIds?: string[];
}) {
  form.id = role.id;
  roleKey.value = role.roleKey;
  form.roleName = role.roleName;
  form.sort = role.sort ?? 0;
  form.remark = role.remark ?? '';

  const selectedIds = new Set(role.menuIds ?? []);
  const checkedKeys = getLeafCheckedKeys(menuTree.value, selectedIds);

  void nextTick(() => {
    menuTreeRef.value?.setCheckedKeys(checkedKeys);
    form.menuIds = menuTreeRef.value?.getCheckedKeys().map(String) ?? [];
    formRef.value?.clearValidate();
  });
}

function buildPayload(): RoleUpdatePayload {
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() ?? [];
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() ?? [];

  return {
    id: form.id,
    roleName: form.roleName.trim(),
    sort: form.sort,
    remark: form.remark.trim() || undefined,
    menuIds: [...halfCheckedKeys, ...checkedKeys].map(String),
  };
}

function handleMenuCheck() {
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() ?? [];
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() ?? [];

  form.menuIds = [...halfCheckedKeys, ...checkedKeys].map(String);
}

async function loadRole(roleId: string) {
  const requestToken = ++loadRoleToken;
  loading.value = true;

  try {
    const [role, menuTreeData] = await Promise.all([sysRoleApi.info(roleId), sysMenuApi.tree()]);

    if (requestToken !== loadRoleToken) {
      return;
    }

    menuTree.value = menuTreeData;
    menuTreeLoaded.value = true;
    fillForm(role);
  } catch (error) {
    if (requestToken !== loadRoleToken) {
      return;
    }

    visible.value = false;
    ElMessage.error(error instanceof Error ? error.message : '角色详情加载失败');
  } finally {
    if (requestToken === loadRoleToken) {
      loading.value = false;
    }
  }
}

async function submitForm() {
  if (submitting.value) {
    return;
  }

  const valid = await formRef.value?.validate().catch(() => false);

  if (!valid) {
    return;
  }

  submitting.value = true;

  try {
    await sysRoleApi.update(buildPayload());
    emit('updated', form.id);
    ElMessage.success('角色修改成功');
    visible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色修改失败');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [visible.value, props.roleId] as const,
  ([value, roleId]) => {
    if (value && roleId) {
      void loadRole(roleId);
    }

    if (!value) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <el-drawer v-model="visible" title="编辑角色" size="560px">
    <div v-loading="loading" class="drawer-content">
      <el-form
        ref="formRef"
        class="role-form"
        label-position="top"
        :model="form"
        :rules="rules"
        @submit.prevent="submitForm"
      >
        <el-form-item label="角色 ID">
          <el-input :model-value="form.id" disabled />
        </el-form-item>

        <el-form-item label="角色权限字符">
          <el-input :model-value="roleKey" disabled />
        </el-form-item>

        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="form.roleName"
            maxlength="30"
            placeholder="请输入角色名称"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            class="sort-input"
            :min="0"
            :max="9999"
            :precision="0"
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="选填，请输入备注"
          />
        </el-form-item>

        <el-form-item label="菜单权限">
          <div v-loading="menuTreeLoading" class="menu-tree-panel">
            <el-tree
              ref="menuTreeRef"
              :data="menuTree"
              show-checkbox
              node-key="id"
              :props="menuTreeProps"
              default-expand-all
              @check="handleMenuCheck"
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

            <el-empty
              v-if="menuTreeLoaded && !menuTreeLoading && menuTree.length === 0"
              description="暂无可选菜单"
              :image-size="72"
            />
          </div>
        </el-form-item>

        <div class="form-actions">
          <button class="ghost-button" type="button" @click="visible = false">取消</button>
          <button class="primary-button" type="submit" :disabled="submitting || loading">
            {{ submitting ? '正在保存' : '保存修改' }}
          </button>
        </div>
      </el-form>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-content {
  min-height: 420px;
}

.role-form {
  display: grid;
  gap: 4px;
}

.sort-input {
  width: 100%;
}

.menu-tree-panel {
  width: 100%;
  min-height: 180px;
  max-height: 320px;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--ez-line);
  border-radius: 10px;
  background: #f8faff;
}

.menu-tree-panel :deep(.el-tree-node__content) {
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

.ghost-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--ez-line);
  border-radius: 8px;
  color: #55637f;
  background: #fff;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.primary-button {
  color: #fff;
  border-color: var(--ez-primary);
  background: var(--ez-primary);
  font-weight: 650;
}

.ghost-button:hover {
  color: var(--ez-primary-dark);
  border-color: rgba(56, 102, 242, 0.4);
  background: #f6f8ff;
}

.primary-button:hover:not(:disabled) {
  border-color: var(--ez-primary-dark);
  background: var(--ez-primary-dark);
}

.primary-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
