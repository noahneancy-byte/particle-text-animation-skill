import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import './ParticleText.css';

export type ParticleTextTrigger = 'mount' | 'hover' | 'click';

export interface ParticleTextProps {
  text?: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: ParticleTextTrigger;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Particle {
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  delay: number;
  phase: number;
  highlighted: boolean;
}

interface Point {
  x: number;
  y: number;
  active: boolean;
}

const TAU = Math.PI * 2;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

function measuredFontSize(
  wrapper: HTMLDivElement,
  fontSize: number | string,
  fontWeight: number | string,
  fontFamily: string,
) {
  if (typeof fontSize === 'number') return fontSize;

  const probe = document.createElement('span');
  probe.textContent = 'M';
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    fontSize,
    fontWeight: String(fontWeight),
    fontFamily,
  });
  wrapper.appendChild(probe);
  const value = Number.parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  return Number.isFinite(value) ? value : 96;
}

export default function ParticleText({
  text = 'React Bits',
  particleSize = 2,
  density = 4,
  color = '#ffffff',
  highlightColor = '#8b5cf6',
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  trigger = 'mount',
  fontSize = 'clamp(3rem, 12vw, 8rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  glow = true,
  className = '',
  style,
}: ParticleTextProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef<Point>({ x: 0, y: 0, active: false });
  const startTimeRef = useRef(0);
  const frameRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const scatterParticles = useCallback((now = performance.now()) => {
    for (const particle of particlesRef.current) {
      const angle = Math.random() * TAU;
      const distance = scatter * (0.3 + Math.random() * 0.7);
      particle.startX = particle.targetX + Math.cos(angle) * distance;
      particle.startY = particle.targetY + Math.sin(angle) * distance;
      particle.delay = Math.random() * stagger;
    }
    startTimeRef.current = now;
  }, [scatter, stagger]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches;
    };
    updateMotionPreference();
    motionQuery.addEventListener('change', updateMotionPreference);

    let disposed = false;
    let sampleTimer = 0;

    const sampleText = () => {
      const bounds = wrapper.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = width;
      sampleCanvas.height = height;
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      if (!sampleContext) return;

      const resolvedSize = measuredFontSize(wrapper, fontSize, fontWeight, fontFamily);
      const inheritedFamily = getComputedStyle(wrapper).fontFamily;
      const resolvedFamily = fontFamily === 'inherit' ? inheritedFamily : fontFamily;
      sampleContext.font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;
      sampleContext.textAlign = 'center';
      sampleContext.textBaseline = 'middle';
      sampleContext.fillStyle = '#ffffff';
      sampleContext.fillText(text, width / 2, height / 2);

      const pixels = sampleContext.getImageData(0, 0, width, height).data;
      const step = Math.max(2, Math.round(density));
      const particles: Particle[] = [];

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          if (pixels[(y * width + x) * 4 + 3] < 120) continue;
          const angle = Math.random() * TAU;
          const distance = scatter * (0.3 + Math.random() * 0.7);
          const hash = Math.abs((x * 73856093) ^ (y * 19349663));
          particles.push({
            targetX: x,
            targetY: y,
            startX: x + Math.cos(angle) * distance,
            startY: y + Math.sin(angle) * distance,
            delay: Math.random() * stagger,
            phase: Math.random() * TAU,
            highlighted: hash % 100 < 34,
          });
        }
      }

      particlesRef.current = particles;
      startTimeRef.current = performance.now();
    };

    const draw = (now: number) => {
      if (disposed) return;
      const elapsed = reducedMotionRef.current
        ? gatherDuration + stagger
        : now - startTimeRef.current;
      const pointer = pointerRef.current;
      const normalPath = new Path2D();
      const highlightPath = new Path2D();
      const radius = Math.max(0.5, particleSize / 2);

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particlesRef.current) {
        const progress = easeOutCubic(
          clamp01((elapsed - particle.delay) / Math.max(1, gatherDuration)),
        );
        const settled = progress === 1;
        const drift = settled && !reducedMotionRef.current
          ? Math.sin(now * 0.0012 + particle.phase) * idleDrift
          : 0;
        let x = particle.startX + (particle.targetX - particle.startX) * progress + drift;
        let y = particle.startY + (particle.targetY - particle.startY) * progress
          + Math.cos(now * 0.001 + particle.phase) * drift;

        if (pointer.active && !reducedMotionRef.current) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < repelRadius) {
            const force = Math.pow(1 - distance / repelRadius, 2) * pointerRepel;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
          }
        }

        const path = particle.highlighted ? highlightPath : normalPath;
        path.moveTo(x + radius, y);
        path.arc(x, y, radius, 0, TAU);
      }

      context.save();
      if (glow) {
        context.shadowBlur = 8;
        context.shadowColor = highlightColor;
      }
      context.fillStyle = color;
      context.fill(normalPath);
      context.fillStyle = highlightColor;
      context.fill(highlightPath);
      context.restore();

      frameRef.current = requestAnimationFrame(draw);
    };

    const scheduleSample = () => {
      window.clearTimeout(sampleTimer);
      sampleTimer = window.setTimeout(sampleText, 80);
    };

    const resizeObserver = new ResizeObserver(scheduleSample);
    resizeObserver.observe(wrapper);

    const begin = async () => {
      if ('fonts' in document) await document.fonts.ready;
      if (disposed) return;
      sampleText();
      frameRef.current = requestAnimationFrame(draw);
    };
    void begin();

    return () => {
      disposed = true;
      window.clearTimeout(sampleTimer);
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', updateMotionPreference);
    };
  }, [
    color,
    density,
    fontFamily,
    fontSize,
    fontWeight,
    gatherDuration,
    glow,
    highlightColor,
    idleDrift,
    particleSize,
    pointerRepel,
    repelRadius,
    scatter,
    stagger,
    text,
  ]);

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      active: true,
    };
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    updatePointer(event);
    if (trigger === 'hover' && !reducedMotionRef.current) scatterParticles();
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
  };

  const handleClick = () => {
    if (trigger === 'click' && !reducedMotionRef.current) scatterParticles();
  };

  return (
    <div
      ref={wrapperRef}
      className={`particle-text ${className}`.trim()}
      style={style}
      onPointerMove={updatePointer}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="particle-text__canvas" aria-hidden="true" />
      <span className="particle-text__sr-only">{text}</span>
    </div>
  );
}
