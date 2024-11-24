import cat from "../assets/cat.jpg";
import { mat4x4Size } from "../math.js";
import { Material } from "../view/material.js";
import { GlobeMesh } from "../view/meshes/globeMesh.js";
import type { GpuResources } from "./requestGpuResources.js";

export type GpuBuffers = {
  globeMesh: GlobeMesh;
  material: Material;
  uniformBuffer: GPUBuffer;
  objectBuffer: GPUBuffer;
  tileDataBufferPing: GPUBuffer;
  tileDataBufferPong: GPUBuffer;
};

export async function allocateGpuBuffers(
  renderResources: GpuResources,
): Promise<GpuBuffers> {
  const globeMesh = new GlobeMesh(renderResources.device);
  const material = new Material();

  const objectBuffer = renderResources.device.createBuffer({
    label: "object_buffer",
    size: mat4x4Size(1024), // Space for up to this many objects
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const tileDataBufferPing = renderResources.device.createBuffer({
    label: "tile_data_buffer_0",
    size: globeMesh.dataArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const tileDataBufferPong = renderResources.device.createBuffer({
    label: "tile_data_buffer_1",
    size: globeMesh.dataArray.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const uniformBuffer = renderResources.device.createBuffer({
    label: "uniform_buffer",
    size: 64 * 2, // 64 for each matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  await material.initialize(renderResources.device, cat);

  return {
    globeMesh,
    material,
    uniformBuffer,
    objectBuffer,
    tileDataBufferPing,
    tileDataBufferPong,
  };
}
