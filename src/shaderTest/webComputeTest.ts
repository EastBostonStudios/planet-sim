import test2 from "./test.glsl";
import test from "./test.wgsl?raw";

console.log(test2);
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

  const c = gpuDevice.createBindGroupLayout({
    entries: new Array<GPUBindGroupLayoutEntry>({
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: "storage" },
    }),
  });

  const d = gpuDevice.createComputePipeline({
    layout: gpuDevice.createPipelineLayout({ bindGroupLayouts: [c] }),
    compute: { module: gpuShaderModule, entryPoint: "main" },
  });

  const o = 1e3;

  const s = gpuDevice.createBuffer({
    size: o,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const i = gpuDevice.createBuffer({
    size: o,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const p = gpuDevice.createBindGroup({
    layout: c,
    entries: [{ binding: 1, resource: { buffer: s } }],
  });

  const n = gpuDevice.createCommandEncoder();

  const t = n.beginComputePass();
  t.setPipeline(d);
  t.setBindGroup(0, p);
  t.dispatchWorkgroups(Math.ceil(o / 64));
  t.end();
  n.copyBufferToBuffer(s, 0, i, 0, o);
  const f = n.finish();
  gpuDevice.queue.submit([f]);
  await i.mapAsync(GPUMapMode.READ, 0, o);
  const g = i.getMappedRange(0, o);
  console.log(new Float32Array(g));
};
