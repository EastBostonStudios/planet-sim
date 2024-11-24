import type { GpuResources } from "../async/requestGpuResources.js";
import type { ScreenSpaceBuffers } from "../async/screenSpaceBuffers.js";
import { BindGroupBuilder } from "../view/builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "../view/builders/bindGroupLayoutBuilder.js";
import post from "../view/shaders/post.wgsl";

export type PostProcessingPass = {
  readonly bindGroup: GPUBindGroup;
  readonly pipeline: GPURenderPipeline;
};

export function createPostProcessingPass(
  { device, format }: GpuResources,
  { screenTextureView }: ScreenSpaceBuffers,
): PostProcessingPass {
  // Screen texture
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const layout = BindGroupLayoutBuilder.Create("post_processing")
    .addMaterial(GPUShaderStage.FRAGMENT, "2d")
    .build(device);
  const bindGroup = BindGroupBuilder.Create("post_processing", layout)
    .addMaterial(screenTextureView, sampler)
    .build(device);

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [layout],
  });

  const pipeline = device.createRenderPipeline({
    label: "post_processing_pipeline",
    vertex: {
      module: device.createShaderModule({ code: post }),
      entryPoint: "vs_main",
    },
    fragment: {
      module: device.createShaderModule({ code: post }),
      entryPoint: "fs_main",
      targets: [{ format: format }],
    },
    primitive: {
      topology: "triangle-list",
    },
    layout: pipelineLayout,
  });

  return {
    bindGroup,
    pipeline,
  };
}
