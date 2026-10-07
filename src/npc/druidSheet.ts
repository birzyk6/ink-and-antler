/** Layout of src/assets/druid.webp; keep in sync with scripts/build-assets.mjs. */
export const FRAME_W = 162;
export const FRAME_H = 224;
export const FRAMES = 6;
export const IDLE_FRAMES = [0, 1] as const;
export const WALK_FRAMES = [2, 3, 4, 5] as const;

/** On-screen size relative to the sheet. Tune visually against the street. */
export const DRUID_SCALE = 0.8;
export const DRUID_W = Math.round(FRAME_W * DRUID_SCALE);
export const DRUID_H = Math.round(FRAME_H * DRUID_SCALE);
