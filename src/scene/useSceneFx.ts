import gsap from 'gsap';
import { AdvancedBloomFilter } from 'pixi-filters';
import { useEffect } from 'react';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { setupAmbient } from './ambient';
import type { SceneHandle } from './createScene';
import { createParticleLayer, type ParticleLayer } from './particleLayer';
import { GOLD_BURST } from './particles';

/** Particles, ambient life and the natural-20 celebration. */
export function useSceneFx(scene: SceneHandle | null) {
  useEffect(() => {
    if (!scene) return;
    const calm = prefersReducedMotion();
    const particles: ParticleLayer | null = calm ? null : createParticleLayer(scene);
    const stopAmbient = setupAmbient(scene, particles, calm);
    let celebration: gsap.core.Timeline | null = null;

    const bloom = new AdvancedBloomFilter({ threshold: 0.45, bloomScale: 0, brightness: 1, blur: 6, quality: 4 });
    const unsubscribe = useGame.subscribe((s, prev) => {
      if (s.celebrate === prev.celebrate || calm) return;
      const at = scene.druidPosition() ?? { x: 960, y: 628 };
      particles?.burst(GOLD_BURST(at.x, at.y - 170));
      celebration?.kill();
      scene.world.filters = [bloom];
      celebration = gsap
        .timeline({ onComplete: () => (scene.world.filters = []) })
        .to(bloom, { bloomScale: 1.6, brightness: 1.25, duration: 0.2, ease: 'power2.out' })
        .to(bloom, { bloomScale: 0, brightness: 1, duration: 1.2, ease: 'power2.in' });
    });

    return () => {
      unsubscribe();
      stopAmbient();
      celebration?.kill();
      if (scene.world.filters?.includes(bloom)) {
        scene.world.filters = [];
      }
      bloom.destroy();
      particles?.destroy();
    };
  }, [scene]);
}
