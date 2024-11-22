import type { mat4 } from "gl-matrix";

export enum ObjectType {
  TRIANGLE = 0,
  QUAD = 1,
}

export interface RenderData {
  viewTransforms: mat4;
  modelTransforms: Float32Array;
  objectCounts: Record<ObjectType, number>;
}
