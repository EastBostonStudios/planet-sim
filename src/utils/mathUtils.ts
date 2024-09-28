import { type Vector2, Vector3 } from "three";

export const getTriangleNumber = (n: number) => (n * (n + 1)) / 2;

export const interpolateOnFace = (props: {
  a: Vector3;
  b: Vector3;
  c: Vector3;
  p: Vector2;
}): Vector3 => {
  const { a, b, c, p } = props;
  if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1 || p.y > p.x)
    throw new Error(`(${p.x}, ${p.y}) out of bounds!`);
  if (p.x === 0) return a;
  const ab = new Vector3().lerpVectors(a, b, p.x);
  const ca = new Vector3().lerpVectors(a, c, p.x);
  return new Vector3().lerpVectors(ab, ca, p.y / p.x);
};