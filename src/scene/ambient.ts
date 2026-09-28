import gsap from 'gsap';
import { Sprite } from 'pixi.js';
import { CLOUD, CLOUD_PALETTE, SIGNPOST as SIGNPOST_ROWS, WOOD } from '../pixel/sprites';
import { CHIMNEYS, FORGE, SIGNPOST, WORLD_W } from '../world/layout';
import type { SceneHandle } from './createScene';
import type { ParticleLayer } from './particleLayer';
import { EMBERS, SMOKE } from './particles';
import { pixelTexture } from './pixelTexture';
import { radialTexture } from './radialTexture';

/** Forge glow, embers, chimney smoke, a drifting cloud and the signpost. Returns a cleanup. */
export function setupAmbient(h: SceneHandle, particles: ParticleLayer | null, calm = false): () => void {
  const r = h.app.renderer;

  const cloud = new Sprite(pixelTexture(r, CLOUD, CLOUD_PALETTE));
  cloud.scale.set(6);
  cloud.position.set(-200, 70);
  cloud.alpha = 0.9;
  h.layers.back.addChild(cloud);
  const drift = calm ? null : gsap.to(cloud, { x: WORLD_W + 200, duration: 140, ease: 'none', repeat: -1 });

  const forge = new Sprite(radialTexture(128, [255, 130, 40]));
  forge.anchor.set(0.5);
  forge.scale.set(1.6);
  forge.blendMode = 'add';
  forge.position.set(FORGE.x, FORGE.y);
  h.layers.back.addChild(forge);
  const flicker = calm ? null : gsap.to(forge, { alpha: 0.55, duration: 0.18, ease: 'steps(2)', yoyo: true, repeat: -1 });

  const post = new Sprite(pixelTexture(r, SIGNPOST_ROWS, WOOD));
  post.scale.set(5);
  post.position.set(SIGNPOST.x - 40, SIGNPOST.feetY - 120);
  h.layers.back.addChild(post);

  const stops = particles
    ? [
        particles.addEmitter(() => EMBERS(FORGE.x + (Math.random() - 0.5) * 30, FORGE.y), 6),
        ...CHIMNEYS.map((c) => particles.addEmitter(() => SMOKE(c.x, c.y), 1.2)),
      ]
    : [];

  return () => {
    drift?.kill();
    flicker?.kill();
    stops.forEach((s) => s());
    [cloud, forge, post].forEach((s) => s.destroy());
  };
}
