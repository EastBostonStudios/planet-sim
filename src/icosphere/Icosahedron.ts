import { Vector2, Vector3 } from "three";

//----------------------------------------------------------------------------------------------------------------------

const a = 0.5257311121191336; //06 (these two decimal places were dropped due to a
const b = 0.8506508083520399; //32  linter error about precision being lost at runtime)
const z = 0.0;

// Derived experimentally, due to 63.434949-degree angle between points
export const distBetweenPoints = 1.1071487177940906;

export type IcospherePoint = {
  index: number;
  coords2D: Vector2;
  coords3D: Vector3;
};

export type IcosphereFace = {
  index: number;
  a: IcospherePoint;
  b: IcospherePoint;
  c: IcospherePoint;
  e0: IcosphereEdge;
  e1: IcosphereEdge;
  e2: IcosphereEdge;
  ab: IcosphereEdge;
  bc: IcosphereEdge;
  wrapsMeridian: boolean;
};

export type IcosphereEdge = {
  index: number;
  start: IcospherePoint;
  end: IcospherePoint;
  wrapsMeridian: boolean;
};

const createPoint = (
  index: number,
  coords2D: Vector2,
  coords3D: Vector3,
): IcospherePoint => ({ index, coords2D, coords3D });

const createEdge = (
  index: number,
  start: IcospherePoint,
  end: IcospherePoint,
  wrapsX?: true,
): IcosphereEdge => ({ index, start, end, wrapsMeridian: wrapsX ?? false });

const createFace = (
  index: number,
  e0: IcosphereEdge,
  e1: IcosphereEdge,
  e2: IcosphereEdge,
): IcosphereFace => {
  // Flip "a" and "c' around for the 10 polar faces
  const isPolar = e0.start === p00 || e2.start === p11;
  const a = isPolar ? e0.start : e1.start;
  const b = e0.end;
  const c = isPolar ? e1.start : e0.start;
  console.assert(a !== b && b !== c && c !== a);
  const wrapsMeridian =
    e0.wrapsMeridian || e1.wrapsMeridian || e2.wrapsMeridian;

  const ab = isPolar ? e0 : e1;
  const bc = isPolar ? e1 : e0;
  return { index, a, b, c, e0, e1, e2, ab, bc, wrapsMeridian };
};

//----------------------------------------------------------------------------------------------------------------------

export const p00 = createPoint(0, new Vector2(3.25, 3), new Vector3(-b, -a, z));
export const p01 = createPoint(1, new Vector2(0, 2), new Vector3(-b, a, z));
export const p02 = createPoint(2, new Vector2(1, 2), new Vector3(-a, z, -b));
export const p03 = createPoint(3, new Vector2(2, 2), new Vector3(z, -b, -a));
export const p04 = createPoint(4, new Vector2(3, 2), new Vector3(z, -b, a));
export const p05 = createPoint(5, new Vector2(4, 2), new Vector3(-a, z, b));
export const p06 = createPoint(6, new Vector2(0, 1), new Vector3(z, b, -a));
export const p07 = createPoint(7, new Vector2(1, 1), new Vector3(a, z, -b));
export const p08 = createPoint(8, new Vector2(2, 1), new Vector3(b, -a, z));
export const p09 = createPoint(9, new Vector2(3, 1), new Vector3(a, z, b));
export const p10 = createPoint(10, new Vector2(4, 1), new Vector3(z, b, a));
export const p11 = createPoint(11, new Vector2(1.75, 0), new Vector3(b, a, z));

//----------------------------------------------------------------------------------------------------------------------

// Zeroth diag
export const e00 = createEdge(0, p00, p01);
export const e01 = createEdge(1, p00, p02);
export const e02 = createEdge(2, p00, p03);
export const e03 = createEdge(3, p00, p04);
export const e04 = createEdge(4, p00, p05);

// First horizontal
export const e05 = createEdge(5, p02, p01);
export const e06 = createEdge(6, p03, p02);
export const e07 = createEdge(7, p04, p03);
export const e08 = createEdge(8, p05, p04);
export const e09 = createEdge(9, p01, p05, true);

// First diag
export const e10 = createEdge(10, p01, p06);
export const e11 = createEdge(11, p02, p06);
export const e12 = createEdge(12, p02, p07);
export const e13 = createEdge(13, p03, p07);
export const e14 = createEdge(14, p03, p08);
export const e15 = createEdge(15, p04, p08);
export const e16 = createEdge(16, p04, p09);
export const e17 = createEdge(17, p05, p09);
export const e18 = createEdge(18, p05, p10);
export const e19 = createEdge(19, p01, p10, true);

// Second horizontal
export const e20 = createEdge(20, p06, p07);
export const e21 = createEdge(21, p07, p08);
export const e22 = createEdge(22, p08, p09);
export const e23 = createEdge(23, p09, p10);
export const e24 = createEdge(24, p10, p06, true);

// Second diag
export const e25 = createEdge(25, p11, p06);
export const e26 = createEdge(26, p11, p07);
export const e27 = createEdge(27, p11, p08);
export const e28 = createEdge(28, p11, p09);
export const e29 = createEdge(29, p11, p10);

//----------------------------------------------------------------------------------------------------------------------

export const f00 = createFace(0, e00, e05, e01);
export const f01 = createFace(1, e01, e06, e02);
export const f02 = createFace(2, e02, e07, e03);
export const f03 = createFace(3, e03, e08, e04);
export const f04 = createFace(4, e04, e09, e00);

export const f05 = createFace(5, e11, e10, e05);
export const f06 = createFace(6, e12, e20, e11);
export const f07 = createFace(7, e13, e12, e06);
export const f08 = createFace(8, e14, e21, e13);
export const f09 = createFace(9, e15, e14, e07);
export const f10 = createFace(10, e16, e22, e15);
export const f11 = createFace(11, e17, e16, e08);
export const f12 = createFace(12, e18, e23, e17);
export const f13 = createFace(13, e19, e18, e09);
export const f14 = createFace(14, e10, e24, e19);

export const f15 = createFace(15, e26, e20, e25);
export const f16 = createFace(16, e27, e21, e26);
export const f17 = createFace(17, e28, e22, e27);
export const f18 = createFace(18, e29, e23, e28);
export const f19 = createFace(19, e25, e24, e29);

//----------------------------------------------------------------------------------------------------------------------

const points: ReadonlyArray<IcospherePoint> = [
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

const edges: ReadonlyArray<IcosphereEdge> = [
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

const faces: ReadonlyArray<IcosphereFace> = [
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

export const icosahedron = { points, edges, faces };

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
