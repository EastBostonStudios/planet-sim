import { BindGroupBuilder } from "../view/builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "../view/builders/bindGroupLayoutBuilder.js";
import computeShader from "../view/shaders/compute.wgsl";
import type { GpuBuffers } from "./gpuBuffers.js";
import type { GpuResources } from "./requestGpuResources.js";

export type ComputePass = {
  readonly bindGroupPing: GPUBindGroup;
  readonly bindGroupPong: GPUBindGroup;
  readonly pipeline: GPUComputePipeline;
};

export function createComputePass(
  { device }: GpuResources,
  { globeMesh, tileDataBufferPing, tileDataBufferPong }: GpuBuffers,
): ComputePass {
  const sizeBuffer = device.createBuffer({
    label: "size_buffer",
    size: 2 * Uint32Array.BYTES_PER_ELEMENT,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.UNIFORM |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.VERTEX,
  });
  device.queue.writeBuffer(
    sizeBuffer,
    0,
    new Float32Array([globeMesh.indexBuffer.size, 0]),
  );

  const layout = BindGroupLayoutBuilder.Create("compute")
    .addBuffer(GPUShaderStage.COMPUTE, "read-only-storage")
    .addBuffer(GPUShaderStage.COMPUTE, "read-only-storage")
    .addBuffer(GPUShaderStage.COMPUTE, "storage")
    .build(device);

  const bindGroupPing = BindGroupBuilder.Create("compute_ping", layout)
    .addBuffer(sizeBuffer)
    .addBuffer(tileDataBufferPing)
    .addBuffer(tileDataBufferPong)
    .build(device);

  const bindGroupPong = BindGroupBuilder.Create("compute_pong", layout)
    .addBuffer(sizeBuffer)
    .addBuffer(tileDataBufferPong)
    .addBuffer(tileDataBufferPing)
    .build(device);

  device.queue.writeBuffer(tileDataBufferPing, 0, globeMesh.dataArray, 0);

  const pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [layout],
    }),
    compute: {
      module: device.createShaderModule({
        code: computeShader,
      }),
      constants: {
        block_size: 256, // workgroupsize
      },
    },
  });

  return {
    bindGroupPing,
    bindGroupPong,
    pipeline,
  };
}
