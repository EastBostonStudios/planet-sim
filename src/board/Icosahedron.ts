import { Vector2, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils";

//------------------------------------------------------------------------------

const a = 0.5257311121191336; //06 (these two decimal places were dropped due to a
const b = 0.8506508083520399; //32  linter error about precision being lost at runtime)
const z = 0.0;

const theta = Math.PI + 1.0172219678840608; // atan(phi, 1) Rotates 0 down to y = -1
export const distBetweenPoints = 1.1071487177940906; // Derived experimentally, due to 63.434949-degree angle between points

//------------------------------------------------------------------------------

export type Point = {
  index: number;
  coords2D: Vector2;
  lngLat: Vector2;
  coords3D: Vector3;
};

export type Face = {
  index: number;
  a: Point;
  b: Point;
  c: Point;
  ab: Edge;
  cb: Edge;
  ca: Edge;
  wrapsMeridian: boolean;
};

export type Edge = {
  index: number;
  start: Point;
  end: Point;
  wrapsMeridian: boolean;
};

//------------------------------------------------------------------------------

const createPoint = (
  index: number,
  coords2D: Vector2,
  lngLat: Vector2,
  coords3D: Vector3,
): Point => {
  const lng = degToRad(lngLat.x);
  const lat = degToRad(lngLat.y);
  const convertedLngLats = new Vector3(
    Math.cos(lat) * Math.cos(lng),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lng),
  );
  // Rotate the icosahedron such that p0 is at y = 1
  const rotatedXYZs = new Vector3(
    coords3D.x * Math.cos(theta) - coords3D.y * Math.sin(theta),
    coords3D.x * Math.sin(theta) + coords3D.y * Math.cos(theta),
    coords3D.z,
  );
  console.log(
    "index:",
    index,
    "error:",
    convertedLngLats.distanceTo(rotatedXYZs).toFixed(1),
  );
  return {
    index,
    coords2D,
    lngLat,
    coords3D: convertedLngLats,
  };
};

const p00 = createPoint(
  0,
  new Vector2(3.25, 3),
  new Vector2(0, 90),
  new Vector3(-b, -a, z),
);
const p01 = createPoint(
  1,
  new Vector2(0, 2),
  new Vector2(-180, 30),
  new Vector3(-b, a, z),
);
const p02 = createPoint(
  2,
  new Vector2(1, 2),
  new Vector2(-108, 30),
  new Vector3(-a, z, -b),
);
const p03 = createPoint(
  3,
  new Vector2(2, 2),
  new Vector2(-36, 30),
  new Vector3(z, -b, -a),
);
const p04 = createPoint(
  4,
  new Vector2(3, 2),
  new Vector2(36, 30),
  new Vector3(z, -b, a),
);
const p05 = createPoint(
  5,
  new Vector2(4, 2),
  new Vector2(108, 30),
  new Vector3(-a, z, b),
);
const p06 = createPoint(
  6,
  new Vector2(0, 1),
  new Vector2(-144, -30),
  new Vector3(z, b, -a),
);
const p07 = createPoint(
  7,
  new Vector2(1, 1),
  new Vector2(-72, -30),
  new Vector3(a, z, -b),
);
const p08 = createPoint(
  8,
  new Vector2(2, 1),
  new Vector2(0, -30),
  new Vector3(b, -a, z),
);
const p09 = createPoint(
  9,
  new Vector2(3, 1),
  new Vector2(72, -30),
  new Vector3(a, z, b),
);
const p10 = createPoint(
  10,
  new Vector2(4, 1),
  new Vector2(144, -30),
  new Vector3(z, b, a),
);
const p11 = createPoint(
  11,
  new Vector2(1.75, 0),
  new Vector2(0, -90),
  new Vector3(b, a, z),
);

export const points: ReadonlyArray<Point> = [
  p00,
  p01,
  p02,
  p03,
  p04,
  p05,
  p06,
  p07,
  p08,
  p09,
  p10,
  p11,
];

//------------------------------------------------------------------------------

const createEdge = (
  index: number,
  start: Point,
  end: Point,
  wrapsX?: true,
): Edge => ({ index, start, end, wrapsMeridian: wrapsX ?? false });

// Zeroth diag
const e00 = createEdge(0, p00, p01);
const e01 = createEdge(1, p00, p02);
const e02 = createEdge(2, p00, p03);
const e03 = createEdge(3, p00, p04);
const e04 = createEdge(4, p00, p05);

// First horizontal
const e05 = createEdge(5, p02, p01);
const e06 = createEdge(6, p03, p02);
const e07 = createEdge(7, p04, p03);
const e08 = createEdge(8, p05, p04);
const e09 = createEdge(9, p01, p05, true);

// First diag
const e10 = createEdge(10, p01, p06);
const e11 = createEdge(11, p02, p06);
const e12 = createEdge(12, p02, p07);
const e13 = createEdge(13, p03, p07);
const e14 = createEdge(14, p03, p08);
const e15 = createEdge(15, p04, p08);
const e16 = createEdge(16, p04, p09);
const e17 = createEdge(17, p05, p09);
const e18 = createEdge(18, p05, p10);
const e19 = createEdge(19, p01, p10, true);

// Second horizontal
const e20 = createEdge(20, p06, p07);
const e21 = createEdge(21, p07, p08);
const e22 = createEdge(22, p08, p09);
const e23 = createEdge(23, p09, p10);
const e24 = createEdge(24, p10, p06, true);

// Second diag
const e25 = createEdge(25, p11, p06);
const e26 = createEdge(26, p11, p07);
const e27 = createEdge(27, p11, p08);
const e28 = createEdge(28, p11, p09);
const e29 = createEdge(29, p11, p10);

export const edges: ReadonlyArray<Edge> = [
  e00,
  e01,
  e02,
  e03,
  e04,
  e05,
  e06,
  e07,
  e08,
  e09,
  e10,
  e11,
  e12,
  e13,
  e14,
  e15,
  e16,
  e17,
  e18,
  e19,
  e20,
  e21,
  e22,
  e23,
  e24,
  e25,
  e26,
  e27,
  e28,
  e29,
];

//------------------------------------------------------------------------------

const createFace = (index: number, ab: Edge, cb: Edge, ca: Edge): Face => {
  // Flip "a" and "c' around for the 10 polar faces
  const a = ab.start;
  const b = ab.end;
  const c = cb.start;
  console.assert(a !== b && b !== c && c !== a);
  console.assert(ab.start === a && ab.end === b);
  console.assert(cb.start === c && cb.end === b);

  const wrapsMeridian =
    ab.wrapsMeridian || cb.wrapsMeridian || ca.wrapsMeridian;
  return { index, a, b, c, ab, cb, ca, wrapsMeridian };
};

const f00 = createFace(0, e00, e05, e01);
const f01 = createFace(1, e01, e06, e02);
const f02 = createFace(2, e02, e07, e03);
const f03 = createFace(3, e03, e08, e04);
const f04 = createFace(4, e04, e09, e00);

const f05 = createFace(5, e10, e11, e05);
const f06 = createFace(6, e20, e12, e11);
const f07 = createFace(7, e12, e13, e06);
const f08 = createFace(8, e21, e14, e13);
const f09 = createFace(9, e14, e15, e07);
const f10 = createFace(10, e22, e16, e15);
const f11 = createFace(11, e16, e17, e08);
const f12 = createFace(12, e23, e18, e17);
const f13 = createFace(13, e18, e19, e09);
const f14 = createFace(14, e24, e10, e19);

const f15 = createFace(15, e26, e20, e25);
const f16 = createFace(16, e27, e21, e26);
const f17 = createFace(17, e28, e22, e27);
const f18 = createFace(18, e29, e23, e28);
const f19 = createFace(19, e25, e24, e29);

export const faces: ReadonlyArray<Face> = [
  f00,
  f01,
  f02,
  f03,
  f04,
  f05,
  f06,
  f07,
  f08,
  f09,
  f10,
  f11,
  f12,
  f13,
  f14,
  f15,
  f16,
  f17,
  f18,
  f19,
];

//------------------------------------------------------------------------------

console.assert(
  points.every((point, i) => point.index === i),
  "Point indices incorrect!",
);

console.assert(
  edges.every((edge, i) => edge.index === i),
  "Edge indices incorrect!",
);

console.assert(
  faces.every((face, i) => face.index === i),
  "Face indices incorrect!",
);
