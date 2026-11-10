<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules, type TreeInstance } from 'element-plus';
import { sysRoleApi } from '@/api/sys-role';
import { sysMenuApi } from '@/api/sys-menu';
import type { MenuTreeNode, RoleCreatePayload } from '@/types/api';

const visible = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  created: [];
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const menuTreeRef = ref<TreeInstance>();
const menuTree = ref<MenuTreeNode[]>([]);
const menuTreeLoading = ref(false);
let menuTreeToken = 0;

const menuTreeProps = {
  label: 'menuName',
  children: 'children',
};

const form = reactive<RoleCreatePayload>({
  roleName: '',
  roleKey: '',
  sort: 0,
  remark: '',
  menuIds: [],
});

const rules: FormRules<RoleCreatePayload> = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 30, message: '角色名称长度不可超过 30 字符', trigger: 'blur' },
  ],
  roleKey: [
    { required: true, message: '请输入角色权限字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9:_-]{0,99}$/,
      message: '权限字符需以字母开头，只能包含字母、数字、冒号、下划线、短横线',
      trigger: 'blur',
    },
  ],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  remark: [{ max: 255, message: '备注长度不可超过 255 字符', trigger: 'blur' }],
};

function resetForm() {
  form.roleName = '';
  form.roleKey = '';
  form.sort = 0;
  form.remark = '';
  form.menuIds = [];
  void nextTick(() => {
    menuTreeRef.value?.setCheckedKeys([]);
    formRef.value?.clearValidate();
  });
}

function buildPayload(): RoleCreatePayload {
  return {
    roleName: form.roleName.trim(),
    roleKey: form.roleKey.trim(),
    sort: form.sort,
    remark: form.remark.trim() || undefined,
    menuIds: [
      ...(menuTreeRef.value?.getHalfCheckedKeys() ?? []),
      ...(menuTreeRef.value?.getCheckedKeys() ?? []),
    ].map(String),
  };
}

function handleMenuCheck() {
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() ?? [];
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() ?? [];

  form.menuIds = [...halfCheckedKeys, ...checkedKeys].map(String);
}

async function loadMenuTree() {
  const requestToken = ++menuTreeToken;
  menuTreeLoading.value = true;

  try {
    const tree = await sysMenuApi.tree();

    if (requestToken !== menuTreeToken) {
      return;
    }

    menuTree.value = tree;
  } catch (error) {
    if (requestToken !== menuTreeToken) {
      return;
    }

    menuTree.value = [];
    ElMessage.error(error instanceof Error ? error.message : '菜单树加载失败');
  } finally {
    if (requestToken === menuTreeToken) {
      menuTreeLoading.value = false;
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
    await sysRoleApi.add(buildPayload());
    emit('created');
    ElMessage.success('角色添加成功');
    visible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色添加失败');
  } finally {
    submitting.value = false;
  }
}

watch(visible, (value) => {
  if (value) {
    void loadMenuTree();
  } else {
    resetForm();
  }
});
</script>

<template>
  <el-drawer v-model="visible" title="添加角色" size="560px">
    <el-form
      ref="formRef"
      class="role-form"
      label-position="top"
      :model="form"
      :rules="rules"
      @submit.prevent="submitForm"
    >
      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="form.roleName"
          maxlength="30"
          placeholder="请输入角色名称"
          autocomplete="off"
        />
      </el-form-item>

      <el-form-item label="权限字符" prop="roleKey">
        <el-input
          v-model="form.roleKey"
          maxlength="100"
          placeholder="例如：platform_admin"
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
          />

          <el-empty
            v-if="!menuTreeLoading && menuTree.length === 0"
            description="暂无可选菜单"
            :image-size="72"
          />
        </div>
      </el-form-item>

      <div class="form-actions">
        <button class="ghost-button" type="button" @click="visible = false">取消</button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? '正在提交' : '添加角色' }}
        </button>
      </div>
    </el-form>
  </el-drawer>
</template>

<style scoped>
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
