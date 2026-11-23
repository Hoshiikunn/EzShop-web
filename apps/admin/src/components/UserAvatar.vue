<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import defaultAvatarUrl from '@/assets/default-avatar.png';

const props = defineProps<{
  src?: string | null;
  name?: string | null;
  size?: number | string;
  alt?: string;
}>();

const imageLoadFailed = ref(false);

const normalizedSrc = computed(() => props.src?.trim() || defaultAvatarUrl);

const displayedSrc = computed(() =>
  imageLoadFailed.value ? defaultAvatarUrl : normalizedSrc.value,
);

const avatarSize = computed(() => {
  if (typeof props.size === 'number') {
    return `${props.size}px`;
  }

  return props.size || '40px';
});

const avatarAlt = computed(() => props.alt || `${props.name || '用户'} 的头像`);

watch(
  () => props.src,
  () => {
    imageLoadFailed.value = false;
  },
);
</script>

<template>
  <div class="user-avatar" :style="{ width: avatarSize, height: avatarSize }">
    <img :src="displayedSrc" :alt="avatarAlt" @error="imageLoadFailed = true" />
  </div>
</template>

<style scoped>
.user-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: var(--ez-primary);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
