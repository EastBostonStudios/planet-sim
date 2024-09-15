import { Vector2, Vector3 } from "three";

import { icosahedron } from "./Icosahedron";

export type Tile = {
  index: number;
  coords2D: Vector2;
  coords3D: Vector3;
  neighbors: number[];
};

export const chunkStride = 5;

// --------------------------------------------------------------------------------

export const getIcosphereEdgeIndex = (edgeIndex: number, resolution: number) =>
  icosahedron.points.length + edgeIndex * (resolution * chunkStride - 1);

export const getIcosphereTrussIndex = (faceIndex: number, resolution: number) =>
  getIcosphereEdgeIndex(icosahedron.edges.length, resolution) +
  faceIndex * (resolution - 1) * resolution;

// --------------------------------------------------------------------------------

export const getTiles = (resolution: number): ReadonlyArray<Tile> => [
  // Icosphere points
  ...icosahedron.points.map(({ coords2D, coords3D }, index) => ({
    index,
    coords2D,
    coords3D,
    neighbors: [],
  })),
  // Icosphere edges
  ...icosahedron.edges.flatMap(({ start, end }, edgeIndex) => {
    const result = new Array<Tile>();
    for (let i = 0; i < resolution * chunkStride - 1; i++) {
      const start2D = icosahedron.points[start.index].coords2D;
      const start3D = icosahedron.points[start.index].coords3D;
      const end2D = icosahedron.points[end.index].coords2D;
      const end3D = icosahedron.points[end.index].coords3D;
      const t = (i + 1) / (resolution * chunkStride);
      result.push({
        index: getIcosphereEdgeIndex(edgeIndex, resolution) + i,
        coords2D: new Vector2().lerpVectors(start2D, end2D, t),
        coords3D: new Vector3().lerpVectors(start3D, end3D, t),
        neighbors: [],
      });
    }
    return result;
  }),
  /*
  // Icosphere faces
  ...icosahedron.flatMap(({ a, b, c }, faceIndex) => {
    const a2D = icosahedron.points[a].pos2D
    const b2D = icosahedron.points[b].pos2D
    const c2D = icosahedron.points[c].pos2D
    const ab2D = new Vector2().subVectors(b2D, a2D)
    const bc2D = new Vector2().subVectors(c2D, b2D)
    const result = new Array<Tile>(
      getTriangleNumber(resolution * chunkStride, resolution * chunkStride)
    )

    for (let i = 0; i < resolution * chunkStride - 1; i++) {
      for (let j = 0; j < i; j++) {
        const ti = (i + 1) / (resolution * chunkStride)
        const tj = (j + 1) / (resolution * chunkStride)
        const index = getTriangleNumber(i, j)
        result[index] = {
          index,
          pos2D: new Vector2()
            .copy(a2D)
            .addScaledVector(ab2D, ti)
            .addScaledVector(bc2D, tj)
            .multiplyScalar(1),
          pos3D: new Vector3(),
          neighbors: [],
        }
      }
    }
    return result.map((tile) => ({
      ...tile,
      index: getIcosphereTrussIndex(faceIndex, resolution) + tile.index,
    }))
  }),
  // Icosphere faces
  ...icosahedron.flatMap(({ a, b, c }, faceIndex) => {
    return []
  }),*/
];
