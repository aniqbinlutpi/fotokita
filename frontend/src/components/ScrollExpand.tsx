import React, { useCallback, useEffect, useRef } from 'react';
import './ScrollExpand.css';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

export interface ScrollExpandProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: React.ReactNode;
  behindOrb?: React.ReactNode;
  scrollHint?: React.ReactNode;
  background?: React.ReactNode;
  orb?: React.ReactNode;
  orbSize?: number | string;
  orbOffset?: { x?: number; y?: number };
  orbBlendMode?: 'normal' | 'screen' | 'overlay';
  shape?: 'rect' | 'circle';
  circleSize?: number;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  behindOrb,
  scrollHint = '',
  background,
  orb,
  orbSize,
  orbOffset,
  orbBlendMode = 'normal',
  shape = 'rect',
  circleSize,
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const behindOrbRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const blendRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const propsRef = useRef({
    shape,
    circleSize,
    orbSize,
    orbOffset,
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
    hasOrb: Boolean(orb),
  });

  const currentProgressRef = useRef(0);

  const applyProgress = useCallback((p: number) => {
    currentProgressRef.current = p;
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, p);

    if (c.shape === 'circle') {
      const stageW = rootRef.current?.clientWidth || window.innerWidth;
      const stageH = c.useWindowScroll
        ? window.innerHeight
        : (rootRef.current?.clientHeight || window.innerHeight);
      const isMobile = stageW < 768;

      let D: number;
      if (c.orbSize !== undefined) {
        D = typeof c.orbSize === 'number' ? c.orbSize : parseFloat(c.orbSize);
      } else {
        const fraction = c.circleSize ?? (isMobile ? 0.82 : 0.52);
        D = Math.min(stageW, stageH) * fraction;
      }

      const ox = c.orbOffset?.x ?? 0;
      const oy = c.orbOffset?.y ?? 0;

      const r0 = D / 2;
      const originX = stageW / 2 + ox;
      const originY = stageH / 2 + oy;

      const d1 = Math.hypot(originX, originY);
      const d2 = Math.hypot(stageW - originX, originY);
      const d3 = Math.hypot(originX, stageH - originY);
      const d4 = Math.hypot(stageW - originX, stageH - originY);
      const rMax = Math.max(d1, d2, d3, d4);

      const currentR = r0 + (rMax - r0) * e;
      const curX = originX + (stageW / 2 - originX) * e;
      const curY = originY + (stageH / 2 - originY) * e;

      if (e >= 1) {
        frame.style.clipPath = 'none';
      } else {
        frame.style.clipPath = `circle(${currentR.toFixed(1)}px at ${curX.toFixed(1)}px ${curY.toFixed(1)}px)`;
      }
    } else {
      const w = c.startWidth + (100 - c.startWidth) * e;
      const h = c.startHeight + (100 - c.startHeight) * e;
      const ix = Math.max(0, (100 - w) / 2);
      const iy = Math.max(0, (100 - h) / 2);
      const r = c.startRadius + (c.endRadius - c.startRadius) * e;
      frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
    }

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (c.hasOrb) {
      // Photo stays hidden until the orb has expanded big first
      const mediaIn = smoothstep(0.16, 0.44, p);
      media.style.opacity = `${mediaIn}`;

      if (orbRef.current) {
        const ox = c.orbOffset?.x ?? 0;
        const oy = c.orbOffset?.y ?? 0;
        // Orb expands big (1.0 -> 6.5) first before fading out
        const orbOut = smoothstep(0.18, 0.48, p);
        const growProgress = smoothstep(0, 0.52, p);
        const orbScale = 1 + 5.5 * Math.pow(growProgress, 1.2);
        orbRef.current.style.opacity = `${1 - orbOut}`;
        orbRef.current.style.transform = `translate3d(${ox}px, ${oy}px, 0) scale(${orbScale.toFixed(3)})`;
        orbRef.current.style.display = p >= 0.52 ? 'none' : 'flex';
        orbRef.current.style.pointerEvents = orbOut > 0.5 ? 'none' : 'auto';
      }
    } else {
      media.style.opacity = '1';
    }

    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim * e}`;

    if (behindOrbRef.current) {
      const out = smoothstep(0.12, 0.65, p);
      behindOrbRef.current.style.opacity = `${1 - out}`;
      behindOrbRef.current.style.transform = `translate3d(0, ${-24 * out}px, 0) scale(${1 + 0.05 * out})`;
      behindOrbRef.current.style.pointerEvents = 'none';
    }

    if (titleRef.current) {
      const out = smoothstep(0.12, 0.65, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-24 * out}px, 0) scale(${1 + 0.06 * out})`;
      titleRef.current.style.pointerEvents = out > 0.4 ? 'none' : 'auto';
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.68, 1, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
      overlayRef.current.style.pointerEvents = inn > 0.5 ? 'auto' : 'none';
    }

    if (blendRef.current) {
      const blendProgress = smoothstep(0.12, 0.82, p);
      blendRef.current.style.opacity = `${blendProgress}`;
    }

    if (backgroundRef.current) {
      const bgOut = smoothstep(0, 0.45, p);
      backgroundRef.current.style.opacity = `${1 - bgOut}`;
      backgroundRef.current.style.pointerEvents = bgOut > 0.5 ? 'none' : 'auto';
    }
  }, []);

  useEffect(() => {
    propsRef.current = {
      shape,
      circleSize,
      orbSize,
      orbOffset,
      startWidth,
      startHeight,
      startRadius,
      endRadius,
      mediaZoom,
      scrollDistance,
      holdDistance,
      smoothing,
      overlayScrim,
      useWindowScroll,
      enabled,
      hasOrb: Boolean(orb),
    };
    applyProgress(currentProgressRef.current);
  }, [
    shape,
    circleSize,
    orbSize,
    orbOffset,
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
    orb,
    applyProgress,
  ]);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || window.innerWidth;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);

      const isMobile = w < 768;
      const fraction = c.circleSize ?? (isMobile ? 0.82 : 0.52);
      const D = Math.min(w, stageH) * fraction;
      stage.style.setProperty('--se-circle-d', `${Math.round(D)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        style={orb ? { opacity: 0 } : undefined}
      />
    ) : (
      <img
        ref={mediaRef as React.RefObject<HTMLImageElement>}
        className="scroll-expand__media"
        src={src}
        alt={alt}
        draggable={false}
        style={orb ? { opacity: 0 } : undefined}
      />
    );

  let initialClipPath = `inset(${Math.max(0, (100 - startHeight) / 2)}% ${Math.max(0, (100 - startWidth) / 2)}% ${Math.max(0, (100 - startHeight) / 2)}% ${Math.max(0, (100 - startWidth) / 2)}% round ${startRadius}px)`;

  if (shape === 'circle') {
    let D = 200;
    if (orbSize !== undefined) {
      D = typeof orbSize === 'number' ? orbSize : parseFloat(orbSize);
    } else if (typeof window !== 'undefined') {
      const stageW = window.innerWidth;
      const stageH = window.innerHeight;
      const isMobile = stageW < 768;
      const fraction = circleSize ?? (isMobile ? 0.82 : 0.52);
      D = Math.min(stageW, stageH) * fraction;
    }
    const ox = orbOffset?.x ?? 0;
    const oy = orbOffset?.y ?? 0;
    if (typeof window !== 'undefined') {
      const stageW = window.innerWidth;
      const stageH = window.innerHeight;
      initialClipPath = `circle(${(D / 2).toFixed(1)}px at ${(stageW / 2 + ox).toFixed(1)}px ${(stageH / 2 + oy).toFixed(1)}px)`;
    } else {
      initialClipPath = `circle(${(D / 2).toFixed(1)}px at calc(50% + ${ox}px) calc(50% + ${oy}px))`;
    }
  }

  return (
    <div
      ref={rootRef}
      className={`scroll-expand ${useWindowScroll ? '' : 'scroll-expand--scroller'} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          {background ? (
            <div ref={backgroundRef} className="scroll-expand__background">
              {background}
            </div>
          ) : null}
          {behindOrb ? (
            <div ref={behindOrbRef} className="scroll-expand__behind-orb">
              {behindOrb}
            </div>
          ) : null}
          <div
            ref={frameRef}
            className="scroll-expand__frame"
            style={{
              clipPath: initialClipPath,
            }}
          >
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}
          </div>
          {orb ? (
            <div
              ref={orbRef}
              className="scroll-expand__orb"
              style={{
                mixBlendMode: orbBlendMode,
                transform: `translate3d(${orbOffset?.x ?? 0}px, ${orbOffset?.y ?? 0}px, 0)`,
              }}
            >
              <div
                className="scroll-expand__orb-inner"
                style={
                  orbSize !== undefined
                    ? {
                        width: typeof orbSize === 'number' ? `${orbSize}px` : orbSize,
                        height: typeof orbSize === 'number' ? `${orbSize}px` : orbSize,
                      }
                    : undefined
                }
              >
                {orb}
              </div>
            </div>
          ) : null}
          {title ? (
            <div ref={titleRef} className="scroll-expand__title">
              {title}
            </div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              {scrollHint}
            </div>
          ) : null}
          {/* Seamless bottom blend gradient */}
          <div ref={blendRef} className="scroll-expand__bottom-blend" />
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
