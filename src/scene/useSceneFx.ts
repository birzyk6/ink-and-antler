import gsap from 'gsap';
import { AdvancedBloomFilter } from 'pixi-filters';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { setupAmbient } from './ambient';
import type { SceneHandle } from './createScene';
import { createParticleLayer, type ParticleLayer } from './particleLayer';
import { EMBERS, GOLD_BURST, SPARKS } from './particles';

export interface SceneFx {
  ignite(x: number, y: number): void;
}

/** Particles, ambient life and the natural-20 celebration. */
export function useSceneFx(scene: SceneHandle | null) {
  const fx = useRef<SceneFx | null>(null);

  useEffect(() => {
    if (!scene) return;
    const calm = prefersReducedMotion();
    const particles: ParticleLayer | null = calm ? null : createParticleLayer(scene);
    const stopAmbient = setupAmbient(scene, particles);
    const stops: (() => void)[] = [];

    fx.current = {
      ignite(x, y) {
        if (!particles) return;
        particles.burst(SPARKS(x, y));
        stops.push(particles.addEmitter(() => EMBERS(x + (Math.random() - 0.5) * 10, y), 3));
      },
    };

    const bloom = new AdvancedBloomFilter({ threshold: 0.45, bloomScale: 0, brightness: 1, blur: 6, quality: 4 });
    const unsubscribe = useGame.subscribe((s, prev) => {
      if (s.celebrate === prev.celebrate || calm) return;
      const at = scene.druidPosition() ?? { x: 960, y: 628 };
      particles?.burst(GOLD_BURST(at.x, at.y - 170));
      scene.world.filters = [bloom];
      gsap
        .timeline({ onComplete: () => (scene.world.filters = []) })
        .to(bloom, { bloomScale: 1.6, brightness: 1.25, duration: 0.2, ease: 'power2.out' })
        .to(bloom, { bloomScale: 0, brightness: 1, duration: 1.2, ease: 'power2.in' });
    });

    return () => {
      unsubscribe();
      stops.forEach((s) => s());
      stopAmbient();
      particles?.destroy();
      fx.current = null;
    };
  }, [scene]);

  return fx;
}
