import { Vector2 } from "three";
import { type IcosphereFace, icosahedron } from "./Icosahedron";

export type Chunk = {
  index: number;
  face: IcosphereFace;
  faceCoords: {
    a: Vector2;
    b: Vector2;
    c: Vector2;
  };
};

export const getChunks = (resolution: number): ReadonlyArray<Chunk> => {
  const rp1 = resolution + 1;
  const result = new Array<Chunk>();
  let index = 0;
  for (let f = 0; f < icosahedron.faces.length; f++) {
    const face = icosahedron.faces[f];
    for (let y = 0; y < rp1; y++) {
      for (let x = y + 0; x < rp1; x++) {
        const p00 = new Vector2(x / rp1, y / rp1);
        const p10 = new Vector2((x + 1) / rp1, y / rp1);
        const p11 = new Vector2((x + 1) / rp1, (y + 1) / rp1);
        const mod = index % 3;
        result.push({
          index: index++,
          face,
          faceCoords:
            mod === 0
              ? { a: p00, b: p10, c: p11 }
              : mod === 1
                ? { a: p11, b: p00, c: p10 }
                : { a: p10, b: p11, c: p00 },
        });
      }
      for (let x = y + 1; x < rp1; x++) {
        const p00 = new Vector2(x / rp1, y / rp1);
        const p01 = new Vector2(x / rp1, (y + 1) / rp1);
        const p11 = new Vector2((x + 1) / rp1, (y + 1) / rp1);
        const mod = index % 3;
        result.push({
          index: index++,
          face,
          faceCoords:
            mod === 0
              ? { a: p11, b: p01, c: p00 }
              : mod === 1
                ? { a: p00, b: p11, c: p01 }
                : { a: p01, b: p00, c: p11 },
        });
      }
    }
  }
  return result;
};

const rp1 = 2;
const result = new Array<Chunk>();
let index = 0;
const face = icosahedron.faces[0];
for (let x = 0; x < rp1; x++) {
  for (let y = 0; y < rp1; y++) {
    result.push({
      index: index++,
      face,
      faceCoords: {
        a: new Vector2(x / rp1, y / rp1),
        b: new Vector2((x + 1) / rp1, y / rp1),
        c: new Vector2((x + 1) / rp1, (y + 1) / rp1),
      },
    });
  }
}
console.log(result.map((a) => a.faceCoords));
