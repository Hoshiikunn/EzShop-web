<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LoginBackground from '@/components/LoginBackground.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loginForm = reactive({
  username: '',
  password: '',
});

const formRef = ref<HTMLFormElement | null>(null);
const backgroundPulse = ref(0);
const loading = ref(false);
const errorMessage = ref('');
const typingTimer = ref<number | null>(null);

function triggerTyping() {
  backgroundPulse.value += 1;

  if (typingTimer.value) {
    window.clearTimeout(typingTimer.value);
  }

  typingTimer.value = window.setTimeout(() => {}, loading.value ? 90 : 150);
}

function stopTyping() {
  if (typingTimer.value) {
    window.clearTimeout(typingTimer.value);
    typingTimer.value = null;
  }
}

async function handleLogin() {
  if (!formRef.value || loading.value) {
    return;
  }

  if (!formRef.value.reportValidity()) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    await authStore.login({ ...loginForm });
    const redirect = route.query.redirect;
    await router.replace(typeof redirect === 'string' ? redirect : '/dashboard');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败';
  } finally {
    loading.value = false;
    stopTyping();
  }
}

onBeforeUnmount(stopTyping);
</script>

<template>
  <main class="login-page">
    <LoginBackground :pulse="backgroundPulse" />

    <section class="login-stage">
      <div class="login-intro">
        <span class="brand-mark">EzShop</span>
        <h1 class="login-title">后台管理登录</h1>
        <p class="login-subtitle">账号输入时，背景会回应你</p>
      </div>

      <form ref="formRef" class="login-panel" @submit.prevent="handleLogin">
        <div class="field">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="loginForm.username"
            type="text"
            name="username"
            required
            autocomplete="username"
            maxlength="20"
            placeholder="员工账号"
            @input="triggerTyping"
          />
        </div>

        <div class="field">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            name="password"
            required
            autocomplete="current-password"
            maxlength="32"
            placeholder="登录密码"
            @input="triggerTyping"
          />
        </div>

        <p v-if="errorMessage" class="form-error" role="alert">
          {{ errorMessage }}
        </p>

        <button class="submit-button" type="submit" :disabled="loading">
          {{ loading ? '正在登录' : '登录' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  min-height: 100vh;
  align-items: center;
  justify-items: center;
  padding: clamp(16px, 4vw, 48px);
  isolation: isolate;
  overflow: hidden;
}

.login-stage {
  position: relative;
  z-index: 1;
  width: min(860px, 100%);
  display: grid;
  gap: clamp(18px, 3vw, 36px);
}

.login-intro {
  text-align: center;
}

.brand-mark {
  display: inline-flex;
  padding: 6px 12px;
  border: 1px solid rgba(255, 122, 168, 0.36);
  border-radius: 999px;
  color: #ffb2cd;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: rgba(255, 122, 168, 0.12);
}

.login-title {
  margin: 14px 0 8px;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 1;
  letter-spacing: -0.02em;
  color: transparent;
  background-image: linear-gradient(120deg, #ffffff, #ffd2e4 26%, #a9b8ff 60%, #7ff0de 100%);
  background-clip: text;
  background-size: 180% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: title-gradient 9s ease-in-out infinite alternate;
}

@keyframes title-gradient {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-title {
    animation: none;
    background-position: 0% 50%;
  }
}

.login-subtitle {
  margin: 0;
  color: rgba(214, 222, 245, 0.68);
  font-size: clamp(14px, 2vw, 16px);
}

.login-panel {
  width: min(440px, 100%);
  margin-inline: auto;
  padding: clamp(20px, 3vw, 30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(15, 20, 38, 0.72);
  box-shadow: 0 24px 80px rgba(2, 6, 20, 0.42);
  backdrop-filter: blur(18px);
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.field label {
  color: rgba(214, 222, 245, 0.72);
  font-size: 13px;
  font-weight: 650;
}

.field input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #f7f9ff;
  background: rgba(255, 255, 255, 0.06);
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field input::placeholder {
  color: rgba(214, 222, 245, 0.4);
}

.field input:focus {
  border-color: var(--ez-primary);
  box-shadow: 0 0 0 4px rgba(142, 162, 255, 0.16);
}

.form-error {
  min-height: 20px;
  margin: 0 0 12px;
  color: #ff8fae;
  font-size: 13px;
}

.submit-button {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(120deg, #ff7aa8, #8ea2ff 62%, #5eead4);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .login-stage {
    align-items: center;
    justify-items: center;
  }

  .login-panel {
    margin-top: -14px;
  }
}
</style>
