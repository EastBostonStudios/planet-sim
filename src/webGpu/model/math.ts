export function degToRad(theta: number) {
  return (theta * Math.PI) / 180.0;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const euclideanModulo = (x: number, a: number) =>
  x - a * Math.floor(x / a);
