<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

interface Spark {
  id: number;
  x: number;
  y: number;
  color: string;
  scale: number;
}

const props = defineProps<{
  pulse: number;
}>();

const sparks = ref<Spark[]>([]);
const sparkTimers = new Set<number>();
let sparkId = 0;

const particles = Array.from({ length: 32 }, (_, index) => {
  const angle = (index / 32) * Math.PI * 2 + index * 0.28;
  const radius = 180 + ((index * 47) % 340);
  const direction = index % 2 === 0 ? 1 : -1;

  return {
    x: 720 + Math.cos(angle) * radius,
    y: 450 + Math.sin(angle) * radius * 0.62,
    radius: 0.9 + ((index * 13) % 5) * 0.55,
    duration: 13 + ((index * 7) % 11),
    delay: -((index * 1.7) % 18),
    offsetX: direction * (8 + ((index * 5) % 16)),
    offsetY: -8 - ((index * 3) % 18),
    variant: index % 3,
  };
});

function removeSpark(id: number) {
  sparks.value = sparks.value.filter((spark) => spark.id !== id);
}

function createSpark() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const id = ++sparkId;
  const colors = ['#ff7aa8', '#8ea2ff', '#5eead4'];
  const spark: Spark = {
    id,
    x: 720 + (Math.random() - 0.5) * 560,
    y: 700 + (Math.random() - 0.5) * 90,
    color: colors[id % colors.length],
    scale: 0.85 + Math.random() * 0.5,
  };

  sparks.value = [...sparks.value.slice(-9), spark];

  const timer = window.setTimeout(() => {
    sparkTimers.delete(timer);
    removeSpark(id);
  }, 1000);

  sparkTimers.add(timer);
}

watch(
  () => props.pulse,
  () => {
    if (props.pulse > 0) {
      createSpark();
    }
  },
);

onBeforeUnmount(() => {
  sparkTimers.forEach((timer) => window.clearTimeout(timer));
  sparkTimers.clear();
});
</script>

<template>
  <div class="login-background" aria-hidden="true">
    <svg class="background-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="night" cx="50%" cy="32%" r="82%">
          <stop offset="0" stop-color="#18203c" />
          <stop offset="0.56" stop-color="#0b1020" />
          <stop offset="1" stop-color="#04060d" />
        </radialGradient>

        <radialGradient id="pinkGlow">
          <stop offset="0" stop-color="#ff7aa8" stop-opacity="0.4" />
          <stop offset="0.46" stop-color="#ff7aa8" stop-opacity="0.14" />
          <stop offset="1" stop-color="#ff7aa8" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="blueGlow">
          <stop offset="0" stop-color="#8ea2ff" stop-opacity="0.4" />
          <stop offset="0.44" stop-color="#8ea2ff" stop-opacity="0.14" />
          <stop offset="1" stop-color="#8ea2ff" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="cyanGlow">
          <stop offset="0" stop-color="#5eead4" stop-opacity="0.24" />
          <stop offset="0.5" stop-color="#5eead4" stop-opacity="0.08" />
          <stop offset="1" stop-color="#5eead4" stop-opacity="0" />
        </radialGradient>

        <linearGradient id="orbitStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8ea2ff" stop-opacity="0.42" />
          <stop offset="0.5" stop-color="#ff7aa8" stop-opacity="0.2" />
          <stop offset="1" stop-color="#5eead4" stop-opacity="0.12" />
        </linearGradient>

        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.9" />
          <stop offset="0.68" stop-color="#fff" stop-opacity="0.28" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>

        <mask id="topFade">
          <rect width="1440" height="900" fill="url(#gridFade)" />
        </mask>

        <pattern id="dotGrid" width="36" height="36" patternUnits="userSpaceOnUse">
          <circle cx="1.8" cy="1.8" r="1.1" fill="rgba(142, 162, 255, 0.26)" />
        </pattern>
      </defs>

      <rect class="night" width="1440" height="900" fill="url(#night)" />

      <g class="glow-layer">
        <ellipse class="glow glow-blue" cx="230" cy="120" rx="470" ry="300" fill="url(#blueGlow)" />
        <ellipse class="glow glow-pink" cx="1180" cy="120" rx="480" ry="310" fill="url(#pinkGlow)" />
        <ellipse class="glow glow-cyan" cx="700" cy="680" rx="420" ry="230" fill="url(#cyanGlow)" />
      </g>

      <rect
        class="dot-grid"
        width="1440"
        height="900"
        fill="url(#dotGrid)"
        mask="url(#topFade)"
      />

      <g class="orbit orbit-a">
        <ellipse cx="720" cy="480" rx="540" ry="210" fill="none" stroke="url(#orbitStroke)" stroke-width="1.2" />
        <circle class="orbit-dot" cx="1260" cy="480" r="4" fill="#8ea2ff" />
      </g>

      <g class="orbit orbit-b">
        <ellipse cx="720" cy="480" rx="680" ry="290" fill="none" stroke="url(#orbitStroke)" stroke-width="1" stroke-dasharray="4 16" />
        <circle class="orbit-dot" cx="180" cy="480" r="3" fill="#ff7aa8" />
      </g>

      <g class="orbit orbit-c">
        <ellipse cx="720" cy="480" rx="360" ry="132" fill="none" stroke="rgba(94, 234, 212, 0.24)" stroke-width="1" stroke-dasharray="2 12" />
        <circle class="orbit-dot" cx="1080" cy="480" r="2.5" fill="#5eead4" />
      </g>

      <g class="particles">
        <circle
          v-for="particle in particles"
          :key="particle.x"
          class="particle"
          :class="`particle-${particle.variant}`"
          :cx="particle.x"
          :cy="particle.y"
          :r="particle.radius"
          :style="`--offset-x: ${particle.offsetX}px; --offset-y: ${particle.offsetY}px; animation-duration: ${particle.duration}s; animation-delay: ${particle.delay}s;`"
        />
      </g>

      <g class="spark-layer">
        <g
          v-for="spark in sparks"
          :key="spark.id"
          class="spark"
          :style="`--spark-color: ${spark.color}; --spark-scale: ${spark.scale};`"
        >
          <circle class="spark-ring" :cx="spark.x" :cy="spark.y" r="22" />
          <circle class="spark-core" :cx="spark.x" :cy="spark.y" r="3.5" />
          <path class="spark-cross" :d="`M ${spark.x - 12} ${spark.y} H ${spark.x + 12} M ${spark.x} ${spark.y - 12} V ${spark.y + 12}`" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.login-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.background-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.glow {
  transform-box: fill-box;
  transform-origin: center;
}

.glow-blue {
  animation: glow-float 24s ease-in-out infinite;
}

.glow-pink {
  animation: glow-float 28s ease-in-out infinite reverse;
}

.glow-cyan {
  animation: glow-float 32s ease-in-out infinite;
  animation-delay: -8s;
}

.dot-grid {
  animation: grid-breathe 10s ease-in-out infinite alternate;
}

.orbit {
  transform-origin: 720px 480px;
}

.orbit-a {
  animation: orbit-rotate 96s linear infinite;
}

.orbit-b {
  animation: orbit-rotate 138s linear infinite reverse;
}

.orbit-c {
  animation: orbit-rotate 72s linear infinite;
}

.orbit-dot {
  filter: drop-shadow(0 0 5px currentColor);
}

.particle {
  transform-box: fill-box;
  transform-origin: center;
  animation-name: particle-drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.particle-0 {
  fill: rgba(142, 162, 255, 0.72);
}

.particle-1 {
  fill: rgba(255, 122, 168, 0.62);
}

.particle-2 {
  fill: rgba(94, 234, 212, 0.5);
}

.spark {
  transform-box: fill-box;
  transform-origin: center;
  animation: spark-burst 1s ease-out forwards;
}

.spark-ring {
  fill: none;
  stroke: var(--spark-color);
  stroke-opacity: 0.5;
  stroke-width: 1;
}

.spark-core {
  fill: var(--spark-color);
  filter: drop-shadow(0 0 6px var(--spark-color));
}

.spark-cross {
  stroke: var(--spark-color);
  stroke-opacity: 0.4;
  stroke-width: 1;
}

@keyframes glow-float {
  0%,
  100% {
    opacity: 0.72;
    transform: translate(0, 0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(18px, -14px) scale(1.06);
  }
}

@keyframes grid-breathe {
  0% {
    opacity: 0.34;
  }
  100% {
    opacity: 0.62;
  }
}

@keyframes orbit-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes particle-drift {
  0%,
  100% {
    opacity: 0.2;
    transform: translate(0, 0) scale(1);
  }
  50% {
    opacity: 0.88;
    transform: translate(var(--offset-x), var(--offset-y)) scale(1.18);
  }
}

@keyframes spark-burst {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(0deg);
  }
  22% {
    opacity: 1;
    transform: scale(calc(1.1 * var(--spark-scale))) rotate(12deg);
  }
  100% {
    opacity: 0;
    transform: scale(calc(0.2 * var(--spark-scale))) rotate(-10deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glow,
  .dot-grid,
  .orbit,
  .particle,
  .spark {
    animation: none !important;
  }

  .glow {
    opacity: 0.68;
  }

  .dot-grid {
    opacity: 0.45;
  }
}
</style>
