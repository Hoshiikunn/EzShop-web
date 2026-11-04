<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { sysUserApi } from '@/api/sys-user';
import type { Gender, UserUpdatePayload, UserId } from '@/types/api';
import AvatarFileInput from '@/components/AvatarFileInput.vue';

const props = defineProps<{
  userId: UserId | null;
}>();

const visible = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  updated: [userId: UserId];
}>();

let loadUserToken = 0;

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const avatarFile = ref<File | null>(null);

type EditUserForm = Omit<UserUpdatePayload, 'avatarUrl'> & {
  avatarUrl: string;
};

const form = reactive<EditUserForm>({
  id: '',
  username: '',
  realName: '',
  gender: undefined,
  avatarUrl: '',
  mobile: '',
  email: '',
});

const rules: FormRules<UserUpdatePayload> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/,
      message: '用户名需以字母开头，可包含字母、数字和下划线，长度 4-20 位',
      trigger: 'blur',
    },
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    {
      pattern: /^(?=.{2,15}$)\p{Script=Han}+(?:·\p{Script=Han}+)*$/u,
      message: '真实姓名需为 2-15 个汉字，可使用间隔号',
      trigger: 'blur',
    },
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  mobile: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式错误',
      trigger: 'blur',
    },
  ],
  email: [{ type: 'email', message: '邮箱格式错误', trigger: 'blur' }],
};

function resetForm() {
  form.id = '';
  form.username = '';
  form.realName = '';
  form.gender = undefined;
  form.avatarUrl = '';
  form.mobile = '';
  form.email = '';
  avatarFile.value = null;
  void formRef.value?.clearValidate();
}

function fillForm(user: {
  id: UserId;
  username: string;
  realName?: string;
  gender?: Gender;
  avatarUrl?: string;
  mobile?: string;
  email?: string;
}) {
  form.id = user.id;
  form.username = user.username;
  form.realName = user.realName ?? '';
  form.gender = user.gender;
  form.avatarUrl = user.avatarUrl ?? '';
  form.mobile = user.mobile ?? '';
  form.email = user.email ?? '';
  void formRef.value?.clearValidate();
}

function buildPayload(): UserUpdatePayload {
  const { gender } = form;

  if (gender !== 0 && gender !== 1) {
    throw new Error('请选择性别');
  }

  return {
    id: form.id,
    username: form.username.trim(),
    realName: form.realName.trim(),
    gender,
    avatarUrl: form.avatarUrl.trim(),
    mobile: form.mobile.trim(),
    email: form.email.trim(),
  };
}

async function loadUser(userId: UserId) {
  const requestToken = ++loadUserToken;
  loading.value = true;
  avatarFile.value = null;

  try {
    const user = await sysUserApi.info(userId);

    if (requestToken !== loadUserToken) {
      return;
    }

    fillForm(user);
  } catch (error) {
    if (requestToken !== loadUserToken) {
      return;
    }

    visible.value = false;
    ElMessage.error(error instanceof Error ? error.message : '用户详情加载失败');
  } finally {
    if (requestToken === loadUserToken) {
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
    await sysUserApi.update(buildPayload());
    emit('updated', form.id);
    ElMessage.success('用户信息已更新');
    visible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户信息更新失败');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [visible.value, props.userId] as const,
  ([value, userId]) => {
    if (value && userId) {
      void loadUser(userId);
    }

    if (!value) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <el-drawer v-model="visible" title="编辑用户" size="560px">
    <div v-loading="loading" class="drawer-content">
      <el-form
        ref="formRef"
        class="edit-form"
        label-position="top"
        :model="form"
        :rules="rules"
        @submit.prevent="submitForm"
      >
        <el-form-item label="用户 ID">
          <el-input :model-value="form.id" disabled />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            maxlength="20"
            placeholder="请输入用户名"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" maxlength="15" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio-button :value="0">女</el-radio-button>
            <el-radio-button :value="1">男</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="头像">
          <AvatarFileInput v-model="avatarFile" />
        </el-form-item>

        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" maxlength="11" placeholder="选填，请输入手机号" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" maxlength="100" placeholder="选填，请输入邮箱" />
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
  min-height: 320px;
}

.edit-form {
  display: grid;
  gap: 4px;
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
