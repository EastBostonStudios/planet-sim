import { type Vector2, Vector3 } from "three";

export const interpolateOnFace = (props: {
  a: Vector3;
  b: Vector3;
  c: Vector3;
  p: Vector2;
}): Vector3 => {
  const { a, b, c, p } = props;
  if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1 || p.y > p.x)
    throw new Error(`(${p.x}, ${p.y}) of bounds!`);
  if (p.x === 0) return a;
  const ab = new Vector3().lerpVectors(a, b, p.x);
  const ca = new Vector3().lerpVectors(a, c, p.x);
  return new Vector3().lerpVectors(ab, ca, p.y / p.x);
};

/*
console.log(
interpolateOnFace({
  a: new Vector3(0, 0, 0),
  b: new Vector3(1, 0, 0),
  c: new Vector3(1, 1, 0),
  p: new Vector2(0, 0),
}),
interpolateOnFace({
  a: new Vector3(0, 0, 0),
  b: new Vector3(1, 0, 0),
  c: new Vector3(1, 1, 0),
  p: new Vector2(1, 0),
}),
interpolateOnFace({
  a: new Vector3(0, 0, 0),
  b: new Vector3(1, 0, 0),
  c: new Vector3(1, 1, 0),
  p: new Vector2(1, 1),
})
)
*/
