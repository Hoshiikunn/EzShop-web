<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { sysMenuApi } from '@/api/sys-menu';
import type { MenuId, MenuInfo, MenuItem, MenuType, MenuUpdatePayload } from '@/types/api';
import { getMenuTypeLabel } from '@/utils/menu-types';
import MenuIconPicker from '@/components/MenuIconPicker.vue';

const props = defineProps<{
  menuId: MenuId | null;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  updated: [menuId: MenuId];
}>();

type MenuForm = Omit<MenuUpdatePayload, 'menuType' | 'visible'> & {
  menuType: MenuType | undefined;
  visible: 0 | 1 | undefined;
};

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const menuList = ref<MenuItem[]>([]);
const menuListLoading = ref(false);
let loadMenuToken = 0;

const form = reactive<MenuForm>({
  id: '',
  pid: '0',
  menuName: '',
  menuType: undefined,
  path: '',
  component: '',
  perms: '',
  icon: '',
  sort: 0,
  visible: undefined,
  openStyle: 0,
});

const currentMenuTypeLabel = computed(() => (form.menuType ? getMenuTypeLabel(form.menuType) : ''));

interface ParentTreeNode {
  id: MenuId;
  menuName: string;
  disabled?: boolean;
  children?: ParentTreeNode[];
}

const parentTreeData = computed(() => buildParentTree(menuList.value));

function isParentDisabled(item: MenuItem): boolean {
  // 权限节点不可作为父菜单
  if (item.menuType === 'F') {
    return true;
  }

  // 目录冻结在根，其余节点全部禁选
  if (form.menuType === 'M') {
    return true;
  }

  if (form.menuType === 'C') {
    return item.menuType !== 'M';
  }

  if (form.menuType === 'F') {
    return item.menuType !== 'C';
  }

  return true;
}

function buildParentTree(items: MenuItem[]): ParentTreeNode[] {
  interface BuildNode extends ParentTreeNode {
    pid: MenuId;
    menuType: MenuType;
    childNodes: ParentTreeNode[];
  }

  const nodes = new Map<string, BuildNode>();

  for (const item of items) {
    nodes.set(item.id, {
      id: item.id,
      pid: item.pid,
      menuName: item.menuName,
      menuType: item.menuType,
      disabled: isParentDisabled(item),
      childNodes: [],
    });
  }

  // 排除自身与自身后代，防止父节点成环
  const excluded = new Set<MenuId>([form.id]);
  let grew = true;

  while (grew) {
    grew = false;

    for (const node of nodes.values()) {
      if (excluded.has(node.pid) && !excluded.has(node.id)) {
        excluded.add(node.id);
        grew = true;
      }
    }
  }

  for (const node of nodes.values()) {
    if (excluded.has(node.id)) {
      node.disabled = true;
    }
  }

  const roots: BuildNode[] = [];

  for (const node of nodes.values()) {
    const parent = nodes.get(node.pid);

    if (parent) {
      parent.childNodes.push(node);
    } else {
      roots.push(node);
    }
  }

  function toTreeNode(node: BuildNode): ParentTreeNode {
    if (node.childNodes.length === 0) {
      return { id: node.id, menuName: node.menuName, disabled: node.disabled };
    }

    return {
      id: node.id,
      menuName: node.menuName,
      disabled: node.disabled,
      children: node.childNodes.map(toTreeNode),
    };
  }

  const root: ParentTreeNode = {
    id: '0',
    menuName: '根菜单',
    disabled: form.menuType === 'F',
    children: roots.map(toTreeNode),
  };

  return [root];
}

const rules: FormRules<MenuForm> = {
  pid: [{ required: true, message: '请选择父菜单', trigger: 'change' }],
  menuName: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { max: 50, message: '菜单名称长度不可超过 50 字符', trigger: 'blur' },
  ],
  path: [{ max: 255, message: '路由地址长度不可超过 255 字符', trigger: 'blur' }],
  component: [{ max: 255, message: '组件路径长度不可超过 255 字符', trigger: 'blur' }],
  perms: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { max: 255, message: '权限标识长度不可超过 255 字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9:_-]*$/,
      message: '权限标识格式错误',
      trigger: 'blur',
    },
  ],
  icon: [{ max: 50, message: '图标长度不可超过 50 字符', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
  visible: [{ required: true, message: '请选择可见性', trigger: 'change' }],
};

function resetForm() {
  form.id = '';
  form.pid = '0';
  form.menuName = '';
  form.menuType = undefined;
  form.path = '';
  form.component = '';
  form.perms = '';
  form.icon = '';
  form.sort = 0;
  form.visible = undefined;
  form.openStyle = 0;
  void nextTick(() => formRef.value?.clearValidate());
}

function fillForm(menu: MenuInfo) {
  form.id = menu.id;
  form.pid = menu.pid;
  form.menuName = menu.menuName;
  form.menuType = menu.menuType;
  form.path = menu.path ?? '';
  form.component = menu.component ?? '';
  form.perms = menu.perms ?? '';
  form.icon = menu.icon ?? '';
  form.sort = menu.sort ?? 0;
  form.visible = menu.visible;
  form.openStyle = menu.openStyle;
  void formRef.value?.clearValidate();
}

function buildPayload(): MenuUpdatePayload {
  const { menuType, visible } = form;

  if (menuType !== 'M' && menuType !== 'C' && menuType !== 'F') {
    throw new Error('请选择菜单类型');
  }

  if (visible !== 0 && visible !== 1) {
    throw new Error('请选择可见性');
  }

  return {
    id: form.id,
    pid: form.pid,
    menuName: form.menuName.trim(),
    menuType,
    path: form.path.trim() || undefined,
    component: form.component.trim() || undefined,
    perms: menuType === 'F' ? form.perms.trim() : undefined,
    icon: form.icon.trim() || undefined,
    sort: form.sort,
    visible,
    openStyle: form.openStyle,
  };
}

async function loadMenu(menuId: MenuId) {
  const requestToken = ++loadMenuToken;
  loading.value = true;

  try {
    const menu = await sysMenuApi.info(menuId);

    if (requestToken !== loadMenuToken) {
      return;
    }

    fillForm(menu);
  } catch (error) {
    if (requestToken !== loadMenuToken) {
      return;
    }

    visible.value = false;
    ElMessage.error(error instanceof Error ? error.message : '菜单详情加载失败');
  } finally {
    if (requestToken === loadMenuToken) {
      loading.value = false;
    }
  }
}

async function loadMenuList() {
  menuListLoading.value = true;

  try {
    menuList.value = await sysMenuApi.list();
  } catch (error) {
    menuList.value = [];
    ElMessage.error(error instanceof Error ? error.message : '菜单列表加载失败');
  } finally {
    menuListLoading.value = false;
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
    await sysMenuApi.update(buildPayload());
    emit('updated', form.id);
    ElMessage.success('菜单修改成功');
    visible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '菜单修改失败');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [visible.value, props.menuId] as const,
  ([value, menuId]) => {
    if (value && menuId) {
      void loadMenu(menuId);
      void loadMenuList();
    }

    if (!value) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <el-drawer v-model="visible" title="修改菜单" size="560px">
    <div v-loading="loading" class="drawer-content">
      <el-form
        ref="formRef"
        class="menu-form"
        label-position="top"
        :model="form"
        :rules="rules"
        @submit.prevent="submitForm"
      >
        <el-form-item label="菜单 ID">
          <el-input :model-value="form.id" disabled />
        </el-form-item>

        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType" disabled>
            <el-radio-button v-if="form.menuType" :value="form.menuType">
              {{ currentMenuTypeLabel }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="父菜单" prop="pid">
          <el-tree-select
            v-model="form.pid"
            class="parent-select"
            :data="parentTreeData"
            :props="{ label: 'menuName', children: 'children', disabled: 'disabled' }"
            node-key="id"
            check-strictly
            default-expand-all
            :loading="menuListLoading"
          />
        </el-form-item>

        <el-form-item label="菜单名称" prop="menuName">
          <el-input
            v-model="form.menuName"
            maxlength="50"
            placeholder="请输入菜单名称"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="路由地址" prop="path">
          <el-input v-model="form.path" maxlength="255" placeholder="选填，请输入路由地址" />
        </el-form-item>

        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" maxlength="255" placeholder="选填，请输入组件路径" />
        </el-form-item>

        <el-form-item v-if="form.menuType === 'F'" label="权限标识" prop="perms">
          <el-input
            v-model="form.perms"
            maxlength="255"
            placeholder="例如：sys:user:add"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <MenuIconPicker v-model="form.icon" />
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

        <el-form-item label="可见性" prop="visible">
          <el-radio-group v-model="form.visible">
            <el-radio-button :value="1">显示</el-radio-button>
            <el-radio-button :value="0">隐藏</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="打开方式" prop="openStyle">
          <el-radio-group v-model="form.openStyle">
            <el-radio-button :value="0">内部</el-radio-button>
            <el-radio-button :value="1">外部</el-radio-button>
          </el-radio-group>
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

.menu-form {
  display: grid;
  gap: 4px;
}

.parent-select {
  width: 100%;
}

.sort-input {
  width: 100%;
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
