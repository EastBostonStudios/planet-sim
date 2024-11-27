import { mat4 } from "gl-matrix";
import type { FC } from "react";
import React from "react";
import { mat4x4Size } from "../webGpu/math.js";
import type { Scene } from "../webGpu/model/scene.js";
import { BindGroupBuilder } from "../webGpu/view/builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "../webGpu/view/builders/bindGroupLayoutBuilder.js";
import type { Material } from "../webGpu/view/material.js";
import type { GlobeMesh } from "../webGpu/view/meshes/globeMesh.js";
import { useLayerName } from "./Layer.js";
import { useGpuDevice } from "./components/GpuDeviceProvider.js";
import { useCreateBuffer } from "./gpuHooks/useCreateBuffer.js";
import { useCreateShaderModule } from "./gpuHooks/useCreateShaderModule.js";
import { useRenderCanvas } from "./gpuHooks/useRenderCanvas.js";
import { useRenderPass } from "./gpuHooks/useRenderPass.js";
import shader from "./shaders/shaders.wgsl";

/**
 * An inner component responsible for managing the rendering side of things,
 * including resizing canvases as necessary.
 *
 * NOTE: It's not worth useEffect()/useMemo()ing code in here. It's better to
 * let it run every time this component refreshes as it prevents delays in the
 *
 * @param name
 * @param material TODO: this should be extracted out
 * @param objectBuffer TODO: this should be extracted out
 * @param scene TODO: this should be extracted out
 * @param globeMesh TODO: this should be extracted out
 * @param context TODO: this should be extracted out
 * @constructor
 */
export const ExampleCanvas: FC<{
  name: string;
  objectBuffer: GPUBuffer;
  scene: Scene;
  globeMesh: GlobeMesh;
  material: Material;
}> = ({ objectBuffer, scene, globeMesh, material, name: localName }) => {
  const { context, format, width, height, aspect } = useRenderCanvas();
  console.log("this shouldn't be called a lot");
  const name = useLayerName(localName);
  const device = useGpuDevice();
  const viewProjectionBuffer = useCreateBuffer({
    label: "view_projection",
    size: 64 * 3, // 64 for each matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const landscapeShader = useCreateShaderModule({
    label: "landscape",
    code: shader,
  });

  const layout = BindGroupLayoutBuilder.Create(`${name}_render`)
    .addBuffer(GPUShaderStage.VERTEX, "uniform")
    .addMaterial(GPUShaderStage.FRAGMENT, "2d") // Two bindings - texture and sampler
    .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
    //   .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
    .build(device);

  const bindGroup = BindGroupBuilder.Create(`${name}_render`, layout)
    .addBuffer(viewProjectionBuffer)
    .addMaterial(material.view, material.sampler)
    .addBuffer(objectBuffer)
    //.addBuffer(tileDataBufferPing)
    .build(device);

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [layout],
  });

  // TODO: Minimaps, etc. don't require a depth stencil
  const depthStencilState: GPUDepthStencilState = {
    format: "depth24plus-stencil8",
    depthWriteEnabled: true,
    depthCompare: "less-equal",
  };

  // Depth buffer
  const depthTexture = device.createTexture({
    label: "depth_texture",
    size: {
      width: width,
      height: height,
      depthOrArrayLayers: 1,
    },
    format: "depth24plus-stencil8",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const depthTextureView = depthTexture.createView({
    label: "depth_texture_view",
    format: "depth24plus-stencil8",
    dimension: "2d",
    aspect: "all",
  });

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
    layout: pipelineLayout,
    depthStencil: depthStencilState,
  });

  const projection = mat4.create();
  mat4.perspective(projection, Math.PI / 4, aspect, 0.1, 100.0);

  useRenderPass((commandEncoder: GPUCommandEncoder) => {
    if (!bindGroup || !pipeline) return;

    const textureView: GPUTextureView = context
      .getCurrentTexture()
      .createView();
    const viewBuffer = scene.camera.view as ArrayBuffer;
    const projBuffer = projection as ArrayBuffer;
    device.queue.writeBuffer(viewProjectionBuffer, mat4x4Size(0), viewBuffer);
    device.queue.writeBuffer(viewProjectionBuffer, mat4x4Size(1), projBuffer);

    const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          storeOp: "store",
        } as GPURenderPassColorAttachment,
      ],
      depthStencilAttachment: depthStencilAttachment,
    });
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, globeMesh.vertexBuffer);
    renderPass.setIndexBuffer(globeMesh.indexBuffer, "uint32");
    renderPass.setBindGroup(0, bindGroup);
    renderPass.drawIndexed(globeMesh.triCount * 3, 1);
    // renderPass.draw(this.globeMesh.vertexCount, 1 /* 1 globe */, 0, 0);
    renderPass.end();
  });

  return <></>;
};
