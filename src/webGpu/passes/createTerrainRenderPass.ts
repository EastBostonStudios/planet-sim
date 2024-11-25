import type { GpuBuffers } from "../async/gpuBuffers.js";
import type { GpuResources } from "../async/requestGpuResources.js";
import type { ScreenSpaceBuffers } from "../async/screenSpaceBuffers.js";
import { BindGroupBuilder } from "../view/builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "../view/builders/bindGroupLayoutBuilder.js";

export type TerrainPass = {
  bindGroup: GPUBindGroup;
  pipeline: GPURenderPipeline;
  depthStencilState: GPUDepthStencilState;
  depthStencilAttachment: GPURenderPassDepthStencilAttachment;
};

export function createTerrainRenderPass(
  { device, format }: GpuResources,
  {
    uniformBuffer,
    material,
    globeMesh,
    objectBuffer,
    tileDataBufferPing,
  }: GpuBuffers,
  { depthTextureView }: ScreenSpaceBuffers,
  landscapeShader: GPUShaderModule,
): TerrainPass {
  console.log("Recreating terrain render pass");

  const layout = BindGroupLayoutBuilder.Create("render")
    .addBuffer(GPUShaderStage.VERTEX, "uniform")
    .addMaterial(GPUShaderStage.FRAGMENT, "2d") // Two bindings - texture and sampler
    .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
    .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
    .build(device);

  const bindGroup = BindGroupBuilder.Create("render", layout)
    .addBuffer(uniformBuffer)
    .addMaterial(material.view, material.sampler)
    .addBuffer(objectBuffer)
    .addBuffer(tileDataBufferPing)
    .build(device);

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [layout],
  });

  const depthStencilState: GPUDepthStencilState = {
    format: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less-equal",
  };

  const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
    view: depthTextureView,
    depthClearValue: 1.0,
    depthLoadOp: "clear",
    depthStoreOp: "store",
    stencilLoadOp: "clear",
    stencilStoreOp: "discard",
  };

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: landscapeShader,
      entryPoint: "vs_main",
      buffers: [globeMesh.bufferLayout],
    },
    fragment: {
      module: landscapeShader,
      entryPoint: "fs_main",
      targets: [{ format: format }],
    },
    primitive: {
      topology: "triangle-list",
    },
    depthStencil: depthStencilState,
    layout: pipelineLayout,
  });

  return {
    bindGroup,
    pipeline,
    depthStencilState,
    depthStencilAttachment,
  };
}
