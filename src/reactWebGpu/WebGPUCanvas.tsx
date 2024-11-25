import { mat4 } from "gl-matrix";
import React, {
  type Dispatch,
  type FC,
  type SetStateAction,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import cat from "../webGpu/assets/cat.jpg";
import { clamp, mat4x4Size } from "../webGpu/math.js";
import type { Scene } from "../webGpu/model/scene.js";
import { BindGroupBuilder } from "../webGpu/view/builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "../webGpu/view/builders/bindGroupLayoutBuilder.js";
import { Material } from "../webGpu/view/material.js";
import type { GlobeMesh } from "../webGpu/view/meshes/globeMesh.js";
import { useGpuDevice } from "./GpuDeviceProvider.js";
import { useCreateBuffer } from "./gpuHooks/useCreateBuffer.js";
import { useShaderModule } from "./gpuHooks/useShaderModule.js";
import shader from "./shaders/shaders.wgsl";

export type CanvasData = {
  id: string;
  label: string;
  renderPassFunc: (commandEncoder: GPUCommandEncoder) => void;
};

export const WebGPUCanvas: FC<{
  label: string;
  flexBasis?: number;
  setCanvases: Dispatch<SetStateAction<CanvasData[]>>;
  objectBuffer: GPUBuffer;
  scene: Scene;
  globeMesh: GlobeMesh;
}> = ({ label, flexBasis, setCanvases, objectBuffer, scene, globeMesh }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const device = useGpuDevice();

  const uniformBuffer = useCreateBuffer({
    label: "uniform_buffer",
    size: 64 * 2, // 64 for each matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const landscapeShader = useShaderModule({
    label: "landscape_shader",
    code: shader,
  });

  const [material, setMaterial] = useState<Material>();
  useEffect(() => {
    (() => {
      const material = new Material();
      material.initialize(device, cat).then(() => {
        console.log("initialized material!");
        setMaterial(material);
      });
    })();
  }, [device]);

  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;

    // Stolen code to support canvas resizing
    const observer = new ResizeObserver(async (entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const maxSize = device.limits.maxTextureDimension2D;
        setWidth(clamp(width, 1, maxSize));
        setHeight(clamp(height, 1, maxSize));
        // const canvas = entry.target;
        // canvasRef.current.width = clamp(width, 1, maxSize);
        // canvasRef.current.height = clamp(height, 1, maxSize);
        // console.log("new width x height", width, height);
      }
    });

    try {
      observer.observe(canvasRef.current, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(canvasRef.current, { box: "content-box" });
    }
  }, [device]);

  const [renderPassFunc, setRenderPassFunc] = useState<{
    func: (commandEncoder: GPUCommandEncoder) => void;
  }>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!uniformBuffer || !canvas || !landscapeShader || !material) return;

    const context = canvas?.getContext("webgpu");
    if (!context) throw new Error("WebGPU canvas context unavailable!");
    const format: GPUTextureFormat = "bgra8unorm";
    context.configure({ device, format, alphaMode: "opaque" });

    const layout = BindGroupLayoutBuilder.Create(`${label}_render`)
      .addBuffer(GPUShaderStage.VERTEX, "uniform")
      .addMaterial(GPUShaderStage.FRAGMENT, "2d") // Two bindings - texture and sampler
      .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
      //   .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
      .build(device);

    const bindGroup = BindGroupBuilder.Create(`${label}_render`, layout)
      .addBuffer(uniformBuffer)
      .addMaterial(material.view, material.sampler)
      .addBuffer(objectBuffer)
      //.addBuffer(tileDataBufferPing)
      .build(device);

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });

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

    const renderPassFunc = (commandEncoder: GPUCommandEncoder) => {
      const projection = mat4.create();
      canvas.width = width;
      canvas.height = height;

      const textureView: GPUTextureView = context
        .getCurrentTexture()
        .createView();
      const aspect = width / height;
      mat4.perspective(projection, Math.PI / 4, aspect, 0.1, 100.0);
      console.log({ width, height, aspect });

      device.queue.writeBuffer(
        uniformBuffer,
        0,
        scene.camera.view as ArrayBuffer,
      );
      device.queue.writeBuffer(
        uniformBuffer,
        mat4x4Size(),
        projection as ArrayBuffer,
      );

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
    };

    setRenderPassFunc({ func: renderPassFunc });
  }, [
    scene,
    label,
    device,
    landscapeShader,
    material,
    uniformBuffer,
    objectBuffer,
    globeMesh,
    width,
    height,
  ]);

  const id = useId();
  useEffect(() => {
    if (renderPassFunc?.func) {
      setCanvases((prev) => {
        const canvasData: CanvasData = {
          id,
          label,
          renderPassFunc: renderPassFunc.func,
        };
        if (!prev.find((data) => data.id === id)) {
          console.log(`Creating canvas "${label}"`);
        }
        const newArray = prev.filter((data) => data.id !== id);
        newArray.push(canvasData);
        return newArray;
      });
    }

    return () => {
      console.log(`Removing canvas "${label}"`);
      setCanvases((prev) => prev.filter((data) => data.id !== id));
    };
  }, [id, label, renderPassFunc, setCanvases]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        minHeight: 0,
        minWidth: 0,
        flexGrow: flexBasis ?? 1,
        flexShrink: flexBasis ?? 1,
        backgroundColor: flexBasis ? "red" : "blue",
      }}
    />
  );
};
