<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Copy, FileImage, ImagePlus, RotateCcw, Trash2 } from 'lucide-vue-next';
import { sysUserApi } from '@/api/sys-user';
import type { Gender, UserCreatePayload, UserInitInfo } from '@/types/api';

const visible = defineModel<boolean>({
  required: true,
});

const emit = defineEmits<{
  created: [];
}>();

const formRef = ref<FormInstance>();
const avatarInputRef = ref<HTMLInputElement | null>(null);
const submitting = ref(false);
const createdUser = ref<UserInitInfo | null>(null);
const avatarFile = ref<File | null>(null);

type CreateUserForm = Omit<UserCreatePayload, 'avatarUrl' | 'gender'> & {
  gender: Gender | undefined;
};

const form = reactive<CreateUserForm>({
  username: '',
  realName: '',
  gender: undefined,
  mobile: '',
  email: '',
});

const rules: FormRules<UserCreatePayload> = {
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

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function clearAvatarInput() {
  if (avatarInputRef.value) {
    avatarInputRef.value.value = '';
  }
}

function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    clearAvatarInput();
    return;
  }

  avatarFile.value = file;
}

function removeAvatarFile() {
  avatarFile.value = null;
  clearAvatarInput();
}

function buildPayload(): UserCreatePayload {
  const { gender } = form;

  if (gender !== 0 && gender !== 1) {
    throw new Error('请选择性别');
  }

  return {
    username: form.username.trim(),
    realName: form.realName.trim(),
    gender,
    mobile: form.mobile.trim() || undefined,
    email: form.email.trim() || undefined,
  };
}

function resetForm() {
  form.username = '';
  form.realName = '';
  form.gender = undefined;
  form.mobile = '';
  form.email = '';
  removeAvatarFile();
  createdUser.value = null;
  void nextTick(() => formRef.value?.clearValidate());
}

async function copyValue(field: 'username' | 'initPassword') {
  if (!createdUser.value) {
    return;
  }

  const value = field === 'username' ? createdUser.value.username : createdUser.value.initPassword;

  try {
    await navigator.clipboard.writeText(value);
    ElMessage.success(field === 'username' ? '用户名已复制' : '初始密码已复制');
  } catch {
    ElMessage.error('复制失败，请手动复制');
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
    createdUser.value = await sysUserApi.add(buildPayload());
    emit('created');
    ElMessage.success('用户添加成功');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '用户添加失败');
  } finally {
    submitting.value = false;
  }
}

watch(visible, (value) => {
  if (!value) {
    resetForm();
  }
});
</script>

<template>
  <el-drawer v-model="visible" title="添加用户" size="560px">
    <div v-if="createdUser" class="drawer-content success-panel">
      <div class="success-icon">
        <RotateCcw :size="24" />
      </div>
      <h2>用户添加成功</h2>
      <p>初始密码仅展示一次，请复制并妥善转交用户。</p>

      <dl class="created-info">
        <div>
          <dt>用户名</dt>
          <dd>
            <code>{{ createdUser.username }}</code>
            <button type="button" @click="copyValue('username')">
              <Copy :size="15" />
              复制
            </button>
          </dd>
        </div>
        <div>
          <dt>初始密码</dt>
          <dd>
            <code>{{ createdUser.initPassword }}</code>
            <button type="button" @click="copyValue('initPassword')">
              <Copy :size="15" />
              复制
            </button>
          </dd>
        </div>
      </dl>

      <div class="success-actions">
        <button class="ghost-button" type="button" @click="resetForm">继续添加</button>
        <button class="primary-button" type="button" @click="visible = false">返回用户列表</button>
      </div>
    </div>

    <div v-else class="drawer-content">
      <el-form
        ref="formRef"
        class="create-form"
        label-position="top"
        :model="form"
        :rules="rules"
        @submit.prevent="submitForm"
      >
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
          <input
            ref="avatarInputRef"
            class="avatar-input"
            type="file"
            accept="image/*"
            @change="handleAvatarChange"
          />

          <button
            v-if="!avatarFile"
            class="avatar-add"
            type="button"
            @click="avatarInputRef?.click()"
          >
            <ImagePlus :size="18" />
            <span>添加文件</span>
          </button>

          <div v-else class="avatar-file">
            <FileImage :size="18" />
            <div class="avatar-file-info">
              <strong>{{ avatarFile.name }}</strong>
              <span>{{ formatFileSize(avatarFile.size) }}</span>
            </div>
            <button type="button" aria-label="移除头像文件" @click="removeAvatarFile">
              <Trash2 :size="15" />
            </button>
          </div>

          <p class="avatar-note">上传接口暂未开放，当前文件仅作预留，不会随表单提交。</p>
        </el-form-item>

        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" maxlength="11" placeholder="选填，请输入手机号" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" maxlength="100" placeholder="选填，请输入邮箱" />
        </el-form-item>

        <div class="form-actions">
          <button class="ghost-button" type="button" @click="visible = false">取消</button>
          <button class="primary-button" type="submit" :disabled="submitting">
            {{ submitting ? '正在提交' : '添加用户' }}
          </button>
        </div>
      </el-form>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-content {
  display: grid;
  align-content: start;
  gap: 20px;
}

.ghost-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
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

.form-actions,
.success-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}

.avatar-input {
  display: none;
}

.avatar-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 76px;
  padding: 14px;
  border: 1px dashed var(--ez-line);
  border-radius: 10px;
  color: #5b6780;
  background: #f8faff;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.avatar-add:hover {
  color: var(--ez-primary-dark);
  border-color: rgba(56, 102, 242, 0.4);
  background: #f6f8ff;
}

.avatar-file {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--ez-line);
  border-radius: 10px;
  color: var(--ez-ink);
  background: #f8faff;
}

.avatar-file-info {
  display: grid;
  flex: 1;
  min-width: 0;
}

.avatar-file-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-file-info span {
  color: var(--ez-muted);
  font-size: 12px;
}

.avatar-file button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: #d2494a;
  background: #fff;
  cursor: pointer;
}

.avatar-note {
  margin: 8px 0 0;
  color: var(--ez-muted);
  font-size: 12px;
}

.success-panel {
  justify-items: center;
  text-align: center;
}

.success-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  color: #217b45;
  background: #e7f7ed;
}

.success-panel h2 {
  margin: 0;
}

.success-panel > p {
  max-width: 380px;
  margin: -6px 0 0;
  color: var(--ez-muted);
}

.created-info {
  width: 100%;
  margin: 0;
}

.created-info div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--ez-line);
  text-align: left;
}

.created-info dt {
  color: var(--ez-muted);
}

.created-info dd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  min-width: 0;
}

.created-info code {
  flex: 1;
  padding: 9px 12px;
  overflow-wrap: anywhere;
  border: 1px solid var(--ez-line);
  border-radius: 8px;
  background: #f7f9ff;
}

.created-info button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--ez-line);
  border-radius: 7px;
  color: var(--ez-primary-dark);
  background: #fff;
  cursor: pointer;
}

.success-actions {
  justify-content: center;
}

@media (max-width: 640px) {
  .form-actions,
  .success-actions {
    flex-direction: column-reverse;
  }

  .form-actions button,
  .success-actions button {
    width: 100%;
  }

  .created-info div {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .created-info dd {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
