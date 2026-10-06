/** World coordinates match sprites/bg/bg.png. Tune positions against the running scene. */
export const WORLD_W = 1920;
export const WORLD_H = 1080;

/** The stage may crop at most this share of the world before it letterboxes instead. */
export const MAX_CROP_X = 0.2;
export const MAX_CROP_Y = 0.15;

/** Feet baseline of the upper street. */
export const STREET_Y = 628;
export const CENTER_X = 960;
export const PATROL_MIN_X = 420;
export const PATROL_MAX_X = 1500;
export const ENTER_START_X = -120;

/** Title sign: horizontal centre and the y of its iron beam. */
export const SIGN = { x: 960, top: 96 };
/** The cat painted on the lower street (fast travel): horizontal centre and feet. */
export const CAT = { x: 342, feetY: 972 };
export const FORGE = { x: 140, y: 520 };
export const CHIMNEYS = [
  { x: 152, y: 292 },
  { x: 520, y: 300 },
];
