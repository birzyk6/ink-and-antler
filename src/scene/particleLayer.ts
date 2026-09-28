import { Container, Sprite, Texture } from 'pixi.js';
import type { SceneHandle } from './createScene';
import { emit, particleAlpha, stepParticles, type EmitSpec, type Particle } from './particles';

export interface ParticleLayer {
  burst(spec: EmitSpec): void;
  /** Emits `make()` about perSecond times per second until the returned stop() is called. */
  addEmitter(make: () => EmitSpec, perSecond: number): () => void;
  destroy(): void;
}

/** Square pixel particles: pooled 1×1 white sprites, tinted and scaled. */
export function createParticleLayer(h: SceneHandle): ParticleLayer {
  const layer = new Container();
  h.layers.front.addChild(layer);
  const pool: Sprite[] = [];
  let particles: Particle[] = [];
  const emitters = new Set<{ make: () => EmitSpec; interval: number; acc: number }>();

  const stopTick = h.onTick((dt) => {
    emitters.forEach((e) => {
      e.acc += dt;
      while (e.acc >= e.interval) {
        e.acc -= e.interval;
        particles.push(...emit(e.make(), Math.random));
      }
    });
    particles = stepParticles(particles, dt);
    while (pool.length < particles.length) {
      const s = new Sprite(Texture.WHITE);
      s.anchor.set(0.5);
      layer.addChild(s);
      pool.push(s);
    }
    pool.forEach((s, i) => {
      const p = particles[i];
      s.visible = !!p;
      if (!p) return;
      s.position.set(Math.round(p.x), Math.round(p.y));
      s.width = s.height = Math.round(p.size);
      s.tint = p.color;
      s.alpha = particleAlpha(p);
    });
  });

  return {
    burst: (spec) => particles.push(...emit(spec, Math.random)),
    addEmitter(make, perSecond) {
      const e = { make, interval: 1000 / perSecond, acc: 0 };
      emitters.add(e);
      return () => emitters.delete(e);
    },
    destroy() {
      stopTick();
      layer.destroy({ children: true });
    },
  };
}
