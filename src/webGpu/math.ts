export function degToRad(theta: number) {
  return (theta * Math.PI) / 180.0;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const euclideanModulo = (x: number, a: number) =>
  x - a * Math.floor(x / a);

export function f32Size(x?: number) {
  return (x ?? 1) * 4;
}

export function mat4Size(x?: number) {
  return (x ?? 1) * 16;
}

export function mat4x4Size(x?: number) {
  return (x ?? 1) * 64;
}
