import { Vector2, Vector3 } from "three";
import type { Face } from "./Icosahedron";

export const getTriangleNumber = (n: number) => (n * (n + 1)) / 2;

export const interpolateOnFace2D = (f: Face, x: number, y: number): Vector2 => {
  if (x < 0 || x > 1 || y < 0 || y > 1 || y > x)
    throw new Error(`(${x}, ${y}) out of bounds!`);
  if (x === 0) return f.a.lngLat;
  const lngLatA = f.a.lngLat;
  const lngLatB = f.b.lngLat;
  const lngLatC = f.c.lngLat;
  const ab = new Vector2().lerpVectors(lngLatA, lngLatB, x);
  const ca = new Vector2().lerpVectors(lngLatA, lngLatC, x);
  return new Vector2().lerpVectors(ab, ca, y / x);
};

export const interpolateOnFace = (
  a: Vector3,
  b: Vector3,
  c: Vector3,
  x: number,
  y: number,
): Vector3 => {
  if (x < 0 || x > 1 || y < 0 || y > 1 || y > x)
    throw new Error(`(${x}, ${y}) out of bounds!`);
  if (x === 0) return a;
  const ab = new Vector3().lerpVectors(a, b, x);
  const ca = new Vector3().lerpVectors(a, c, x);
  return new Vector3().lerpVectors(ab, ca, y / x);
};

export const getCenter = (args: Vector3[]): Vector3 => {
  const center = new Vector3();
  for (let i = 0; i < args.length; i++) center.add(args[i]);
  return center.divideScalar(args.length);
};

export const closeLoop = (points: Vector3[]) => {
  return points.length === 0 ? [] : [...points, points[0]];
};

export const lerpToward = (a: Vector3, b: Vector3, t?: number) =>
  new Vector3().lerpVectors(a, b, t ?? 0.1);
