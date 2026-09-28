/** 4×5 colour matrices (row-major) for Pixi's ColorMatrixFilter. No Pixi import: unit-testable. */
export const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** Cold, dark blue evening. */
export const DUSK = [0.42, 0, 0, 0, 0.0, 0, 0.48, 0, 0, 0.01, 0, 0, 0.78, 0, 0.05, 0, 0, 0, 1, 0];

export function lerpMatrix(a: readonly number[], b: readonly number[], t: number): number[] {
  // v + (b[i] - v) * t drifts by float rounding at t=1 (e.g. 0.41999999999999993 !== 0.42);
  // the a*(1-t)+b*t form is exact at both endpoints.
  return a.map((v, i) => v * (1 - t) + b[i] * t);
}
