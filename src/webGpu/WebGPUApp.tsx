import React, { useLayoutEffect, useRef } from "react";
import shader from "./shaders.wgsl";

const initialize = async (canvas: HTMLCanvasElement) => {
  if (!navigator.gpu) throw new Error("WebGPU not supported!");

  //adapter: wrapper around (physical) GPU.
  //Describes features and limits
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) throw new Error("No GPUAdapter!");

  //device: wrapper around GPU functionality
  //Function calls are made through the device
  const device = await adapter.requestDevice();

  //context: similar to vulkan instance (or OpenGL context)
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("No GPUCanvasContext!");

  const format: GPUTextureFormat = "bgra8unorm";
  context.configure({
    device: device,
    format: format,
    alphaMode: "opaque",
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({ code: shader }),
      entryPoint: "vs_main",
    },
    fragment: {
      module: device.createShaderModule({ code: shader }),
      entryPoint: "fs_main",
      targets: [{ format: format }],
    },
    primitive: {
      topology: "triangle-list",
    },
    layout: pipelineLayout,
  });

  //command encoder: records draw commands for submission
  const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
  //texture view: image view to the color buffer in this case
  const textureView: GPUTextureView = context.getCurrentTexture().createView();
  //renderpass: holds draw commands, allocated from command encoder
  const colorAttachment: GPURenderPassColorAttachment = {
    view: textureView,
    clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
    loadOp: "clear",
    storeOp: "store",
  };
  const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [colorAttachment],
  });
  renderpass.setPipeline(pipeline);
  renderpass.setBindGroup(0, bindGroup);
  renderpass.draw(3, 1, 0, 0);
  renderpass.end();

  device.queue.submit([commandEncoder.finish()]);
};

export const WebGPUApp = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (ref.current) initialize(ref.current);
  }, []);

  return <canvas ref={ref} width={500} height={500} />;
};
