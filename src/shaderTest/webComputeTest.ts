import test2 from "./test.glsl";
import test from "./test.wgsl?raw";

console.log(test2);
export const foo = async () => {
  if (!navigator.gpu)
    throw new Error(
      "WebGPU not supported. Please enable it in about:flags in Chrome or in about:config in Firefox.",
    );

  const u = await navigator.gpu.requestAdapter();
  if (!u) throw new Error("Couldn\u2019t request WebGPU adapter.");

  const e = await u.requestDevice();
  if (!e) throw new Error("Couldn\u2019t request WebGPU device.");

  const l = e.createShaderModule({
    code: test,
  });

  const c = e.createBindGroupLayout({
    entries: [
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
    ],
  });

  const d = e.createComputePipeline({
    layout: e.createPipelineLayout({ bindGroupLayouts: [c] }),
    compute: { module: l, entryPoint: "main" },
  });

  const o = 1e3;

  const s = e.createBuffer({
    size: o,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const i = e.createBuffer({
    size: o,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const p = e.createBindGroup({
    layout: c,
    entries: [{ binding: 1, resource: { buffer: s } }],
  });

  const n = e.createCommandEncoder();

  const t = n.beginComputePass();
  t.setPipeline(d);
  t.setBindGroup(0, p);
  t.dispatchWorkgroups(Math.ceil(o / 64));
  t.end();
  n.copyBufferToBuffer(s, 0, i, 0, o);
  const f = n.finish();
  e.queue.submit([f]);
  await i.mapAsync(GPUMapMode.READ, 0, o);
  const g = i.getMappedRange(0, o);
  const b = g.slice();
  console.log(new Float32Array(b));
};
