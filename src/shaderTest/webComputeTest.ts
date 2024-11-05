import { BufferAttribute, StorageBufferAttribute } from "three";
import test from "./test.wgsl?raw";

export const foo = async () => {
  if (!navigator.gpu)
    throw new Error(
      "WebGPU not supported. Please enable it in about:flags in Chrome or in about:config in Firefox.",
    );

  const gpuAdapter = await navigator.gpu.requestAdapter();
  if (!gpuAdapter) throw new Error("Couldn\u2019t request WebGPU adapter.");

  const gpuDevice = await gpuAdapter.requestDevice();
  if (!gpuDevice) throw new Error("Couldn\u2019t request WebGPU device.");

  const gpuShaderModule = gpuDevice.createShaderModule({
    code: test,
  });

  const gpuBindGroupLayout = gpuDevice.createBindGroupLayout({
    entries: new Array<GPUBindGroupLayoutEntry>({
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "storage" },
    }),
  });

  const gpuComputePipeline = gpuDevice.createComputePipeline({
    layout: gpuDevice.createPipelineLayout({
      bindGroupLayouts: [gpuBindGroupLayout],
    }),
    compute: { module: gpuShaderModule, entryPoint: "main" },
  });

  const o = 1e3;

  const inputGpuBuffer = gpuDevice.createBuffer({
    size: o,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const outputGpuBuffer = gpuDevice.createBuffer({
    size: o,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const gpuBindGroup = gpuDevice.createBindGroup({
    layout: gpuBindGroupLayout,
    entries: [{ binding: 1, resource: { buffer: inputGpuBuffer } }],
  });

  const gpuCommandEncoder = gpuDevice.createCommandEncoder();

  const gpuComputePassEncoder = gpuCommandEncoder.beginComputePass();
  gpuComputePassEncoder.setPipeline(gpuComputePipeline);
  gpuComputePassEncoder.setBindGroup(0, gpuBindGroup);
  gpuComputePassEncoder.dispatchWorkgroups(Math.ceil(o / 64));
  gpuComputePassEncoder.end();
  gpuCommandEncoder.copyBufferToBuffer(
    inputGpuBuffer,
    0,
    outputGpuBuffer,
    0,
    o,
  );
  const gpuCommandBuffer = gpuCommandEncoder.finish();
  gpuDevice.queue.submit([gpuCommandBuffer]);
  await outputGpuBuffer.mapAsync(GPUMapMode.READ, 0, o);
  const outputArrayBuffer = outputGpuBuffer.getMappedRange(0, o);
  const outputTypedArray = new Float32Array(outputArrayBuffer);
  const outputBufferAttribute = new BufferAttribute(outputTypedArray, 3);
  const two = new StorageBufferAttribute();
  return outputBufferAttribute;
};
