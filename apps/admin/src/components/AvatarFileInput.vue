<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { FileImage, ImagePlus, Trash2 } from 'lucide-vue-next';

const model = defineModel<File | null>({
  required: true,
});

const inputRef = ref<HTMLInputElement | null>(null);

function clearInput() {
  if (inputRef.value) {
    inputRef.value.value = '';
  }
}

function triggerSelect() {
  inputRef.value?.click();
}

function removeFile() {
  model.value = null;
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    clearInput();
    return;
  }

  model.value = file;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

watch(model, (value) => {
  if (!value) {
    clearInput();
  }
});
</script>

<template>
  <input
    ref="inputRef"
    class="avatar-input"
    type="file"
    accept="image/*"
    @change="handleFileChange"
  />

  <button v-if="!model" class="avatar-add" type="button" @click="triggerSelect">
    <ImagePlus :size="18" />
    <span>添加文件</span>
  </button>

  <div v-else class="avatar-file">
    <FileImage :size="18" />
    <div class="avatar-file-info">
      <strong>{{ model.name }}</strong>
      <span>{{ formatFileSize(model.size) }}</span>
    </div>
    <button type="button" aria-label="移除头像文件" @click="removeFile">
      <Trash2 :size="15" />
    </button>
  </div>

  <p class="avatar-note">上传接口暂未开放，当前文件仅作预留，不会随表单提交。</p>
</template>

<style scoped>
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
</style>
