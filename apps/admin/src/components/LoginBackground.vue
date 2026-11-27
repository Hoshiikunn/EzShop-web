<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Spark {
  x: number;
  y: number;
  vy: number;
  color: string;
  glow: string;
  scale: number;
  bornAt: number;
}

interface Particle {
  xpct: number;
  ypct: number;
  wobbleX: number;
  wobbleY: number;
  phase: number;
  speed: number;
  size: number;
  colorIndex: number;
}

const props = defineProps<{
  pulse: number;
}>();

const backgroundRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const FRAME_MS = 1000 / 30;
const SPARK_LIFETIME_MS = 1000;
const POINTER_REPEL_RADIUS = 120;
const MAX_SPARKS = 40;

const palette = [
  { fill: 'rgba(142, 162, 255, 0.72)', glow: 'rgba(142, 162, 255, 0.16)' },
  { fill: 'rgba(255, 122, 168, 0.62)', glow: 'rgba(255, 122, 168, 0.14)' },
  { fill: 'rgba(94, 234, 212, 0.5)', glow: 'rgba(94, 234, 212, 0.12)' },
];

const particles = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2 + index * 0.28;
  const radius = 20 + ((index * 47) % 34);

  return {
    xpct: 50 + Math.cos(angle) * radius,
    ypct: 50 + Math.sin(angle) * radius * 0.62,
    wobbleX: 6 + ((index * 5) % 10),
    wobbleY: 5 + ((index * 3) % 9),
    phase: index * 1.7,
    speed: 0.25 + ((index * 7) % 10) / 28,
    size: 0.9 + ((index * 13) % 5) * 0.55,
    colorIndex: index % 3,
  };
});

const orbits = [
  {
    cxPct: 50,
    cyPct: 53.3,
    rxPct: 37.5,
    ryPct: 23.3,
    periodSec: 96,
    dotRadius: 4,
    ringStroke: 'rgba(142, 162, 255, 0.28)',
    dash: null,
    color: '#8ea2ff',
    glow: 'rgba(142, 162, 255, 0.4)',
  },
  {
    cxPct: 50,
    cyPct: 53.3,
    rxPct: 47.2,
    ryPct: 32.2,
    periodSec: 138,
    dotRadius: 3,
    ringStroke: 'rgba(255, 122, 168, 0.22)',
    dash: [4, 16],
    color: '#ff7aa8',
    glow: 'rgba(255, 122, 168, 0.36)',
  },
  {
    cxPct: 50,
    cyPct: 53.3,
    rxPct: 25,
    ryPct: 14.7,
    periodSec: 72,
    dotRadius: 2.5,
    ringStroke: 'rgba(94, 234, 212, 0.24)',
    dash: [2, 12],
    color: '#5eead4',
    glow: 'rgba(94, 234, 212, 0.32)',
  },
];

const sparkColors = [
  { color: '#ff7aa8', glow: 'rgba(255, 122, 168, 0.45)' },
  { color: '#8ea2ff', glow: 'rgba(142, 162, 255, 0.45)' },
  { color: '#5eead4', glow: 'rgba(94, 234, 212, 0.4)' },
];

const sparks: Spark[] = [];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ctx: CanvasRenderingContext2D | null = null;
let canvasWidth = 0;
let canvasHeight = 0;
let rafId = 0;
let lastFrameAt = 0;
let running = false;
let offscreen = false;
let sparkId = 0;
const pointer = { x: -9999, y: -9999 };

function resizeCanvas() {
  const container = backgroundRef.value;
  const canvas = canvasRef.value;

  if (!container || !canvas) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvasWidth = container.clientWidth;
  canvasHeight = container.clientHeight;
  canvas.width = Math.max(1, Math.round(canvasWidth * dpr));
  canvas.height = Math.max(1, Math.round(canvasHeight * dpr));
  ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (prefersReducedMotion()) {
    drawFrame(performance.now());
  }
}

function spawnSpark(x: number, y: number) {
  if (prefersReducedMotion()) {
    return;
  }

  if (sparks.length >= MAX_SPARKS) {
    sparks.shift();
  }

  const id = ++sparkId;
  const paletteEntry = sparkColors[id % sparkColors.length];

  sparks.push({
    x,
    y,
    vy: 26 + Math.random() * 26,
    color: paletteEntry.color,
    glow: paletteEntry.glow,
    scale: 0.85 + Math.random() * 0.5,
    bornAt: performance.now(),
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (
    event.isComposing ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.key === 'Escape' ||
    event.key === 'Tab'
  ) {
    return;
  }

  spawnSpark(
    canvasWidth * (0.5 + (Math.random() - 0.5) * 0.4),
    canvasHeight * (0.62 + (Math.random() - 0.5) * 0.12),
  );
}

function handlePulse() {
  if (props.pulse <= 0) {
    return;
  }

  spawnSpark(
    canvasWidth * (0.5 + (Math.random() - 0.5) * 0.39),
    canvasHeight * (0.78 + (Math.random() - 0.5) * 0.1),
  );
}

function handlePointerMove(event: PointerEvent) {
  const container = backgroundRef.value;

  if (!container) {
    return;
  }

  const rect = container.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
}

function handlePointerDown(event: PointerEvent) {
  const container = backgroundRef.value;

  if (!container) {
    return;
  }

  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    return;
  }

  spawnSpark(x, y);
}

function drawRings() {
  if (!ctx) {
    return;
  }

  for (const orbit of orbits) {
    ctx.beginPath();
    ctx.ellipse(
      (orbit.cxPct / 100) * canvasWidth,
      (orbit.cyPct / 100) * canvasHeight,
      (orbit.rxPct / 100) * canvasWidth,
      (orbit.ryPct / 100) * canvasHeight,
      0,
      0,
      Math.PI * 2,
    );

    if (orbit.dash) {
      ctx.setLineDash(orbit.dash);
    }

    ctx.strokeStyle = orbit.ringStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawOrbitDots(timeSec: number) {
  if (!ctx) {
    return;
  }

  for (const orbit of orbits) {
    const angle = (timeSec / orbit.periodSec) * Math.PI * 2;
    const x = (orbit.cxPct / 100) * canvasWidth + Math.cos(angle) * (orbit.rxPct / 100) * canvasWidth;
    const y = (orbit.cyPct / 100) * canvasHeight + Math.sin(angle) * (orbit.ryPct / 100) * canvasHeight;

    ctx.beginPath();
    ctx.fillStyle = orbit.glow;
    ctx.arc(x, y, orbit.dotRadius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = orbit.color;
    ctx.arc(x, y, orbit.dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(timeSec: number) {
  if (!ctx) {
    return;
  }

  for (const particle of particles) {
    const baseX = (particle.xpct / 100) * canvasWidth;
    const baseY = (particle.ypct / 100) * canvasHeight;
    let x = baseX + Math.cos(timeSec * particle.speed + particle.phase) * particle.wobbleX;
    let y = baseY + Math.sin(timeSec * particle.speed * 0.8 + particle.phase) * particle.wobbleY;

    const dx = pointer.x - x;
    const dy = pointer.y - y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0 && distance < POINTER_REPEL_RADIUS) {
      const push = (1 - distance / POINTER_REPEL_RADIUS) * 14;
      x -= (dx / distance) * push;
      y -= (dy / distance) * push;
    }

    const twinkle = 0.5 + 0.5 * Math.sin(timeSec * 0.9 + particle.phase);
    const entry = palette[particle.colorIndex];

    ctx.beginPath();
    ctx.fillStyle = entry.glow;
    ctx.arc(x, y, particle.size * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.2 + 0.68 * twinkle;
    ctx.beginPath();
    ctx.fillStyle = entry.fill;
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawSparks(now: number) {
  if (!ctx) {
    return;
  }

  for (let index = sparks.length - 1; index >= 0; index -= 1) {
    const spark = sparks[index];
    const progress = (now - spark.bornAt) / SPARK_LIFETIME_MS;

    if (progress >= 1) {
      sparks.splice(index, 1);
      continue;
    }

    const alpha = progress < 0.22 ? progress / 0.22 : 1 - (progress - 0.22) / 0.78;
    const ringRadius = 10 + 26 * progress * spark.scale;
    const y = spark.y - spark.vy * progress;

    ctx.beginPath();
    ctx.strokeStyle = spark.glow;
    ctx.globalAlpha = Math.max(alpha, 0) * 0.6;
    ctx.lineWidth = 1;
    ctx.arc(spark.x, y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = spark.color;
    ctx.globalAlpha = Math.max(alpha, 0);
    ctx.arc(spark.x, y, 3.5 * spark.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFrame(now: number) {
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawRings();
  drawOrbitDots(now / 1000);
  drawParticles(now / 1000);
  drawSparks(now);
}

function loop(now: number) {
  rafId = requestAnimationFrame(loop);

  if (now - lastFrameAt < FRAME_MS) {
    return;
  }

  lastFrameAt = now;
  drawFrame(now);
}

function startLoop() {
  if (running || prefersReducedMotion()) {
    return;
  }

  running = true;
  lastFrameAt = 0;
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  running = false;
  cancelAnimationFrame(rafId);
}

function handleVisibilityChange() {
  if (document.hidden || offscreen) {
    stopLoop();
  } else {
    startLoop();
  }
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
  resizeCanvas();

  if (prefersReducedMotion()) {
    window.addEventListener('resize', resizeCanvas);
    return;
  }

  startLoop();

  observer = new IntersectionObserver((entries) => {
    offscreen = !entries[0]?.isIntersecting;

    if (offscreen || document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  observer.observe(backgroundRef.value!);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', handleKeydown);
});

watch(
  () => props.pulse,
  () => {
    if (props.pulse > 0) {
      handlePulse();
    }
  },
);

onBeforeUnmount(() => {
  stopLoop();
  observer?.disconnect();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('resize', resizeCanvas);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('keydown', handleKeydown);
  sparks.length = 0;
});
</script>

<template>
  <div ref="backgroundRef" class="login-background" aria-hidden="true">
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

      <rect width="1440" height="900" fill="url(#night)" />

      <ellipse cx="230" cy="120" rx="470" ry="300" fill="url(#blueGlow)" />
      <ellipse cx="1180" cy="120" rx="480" ry="310" fill="url(#pinkGlow)" />
      <ellipse cx="700" cy="680" rx="420" ry="230" fill="url(#cyanGlow)" />

      <rect
        class="dot-grid"
        width="1440"
        height="900"
        fill="url(#dotGrid)"
        mask="url(#topFade)"
      />
    </svg>

    <canvas ref="canvasRef" class="dynamic-canvas"></canvas>
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

.background-svg,
.dynamic-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.dynamic-canvas {
  position: absolute;
  inset: 0;
}

.dot-grid {
  opacity: 0.45;
}
</style>
