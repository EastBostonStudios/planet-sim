import { mat4 } from "gl-matrix";
import React, {
  type Dispatch,
  type FC,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Layer } from "../../Layer.js";
import { clamp, mat4x4Size } from "../../webGpu/math.js";
import type { Scene } from "../../webGpu/model/scene.js";
import { BindGroupBuilder } from "../../webGpu/view/builders/bindGroupBuilder.js";
import { BindGroupLayoutBuilder } from "../../webGpu/view/builders/bindGroupLayoutBuilder.js";
import type { GlobeMesh } from "../../webGpu/view/meshes/globeMesh.js";
import { useCreateBuffer } from "../gpuHooks/useCreateBuffer.js";
import { useCreateMaterialAsync } from "../gpuHooks/useCreateMaterialAsync.js";
import { useCreateShaderModule } from "../gpuHooks/useCreateShaderModule.js";
import { useFireOnce } from "../reactHooks/useFireOnce.js";
import shader from "../shaders/shaders.wgsl";
import { useGpuDevice } from "./GpuDeviceProvider.js";

export type CanvasData = {
  id: string;
  label: string;
  renderPassFunc: (commandEncoder: GPUCommandEncoder) => void;
};

interface Props {
  label: string;
  flexBasis?: number;
  setCanvases: Dispatch<SetStateAction<CanvasData[]>>;
  objectBuffer: GPUBuffer;
  scene: Scene;
  globeMesh: GlobeMesh;
  children: ReactNode;
}

export const WebGPUCanvas: FC<Props> = (props) => {
  const device = useGpuDevice();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<{
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
  }>();
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    aspect: number;
  }>();

  useFireOnce(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("webgpu");
    if (!context) throw new Error("WebGPU canvas context unavailable!");
    const format: GPUTextureFormat = "bgra8unorm";
    context.configure({ device, format, alphaMode: "opaque" });
    setData({ canvas, context, format });

    // Modified from https://webgpufundamentals.org/webgpu/lessons/webgpu-resizing-the-canvas.html
    const observer = new ResizeObserver(async (entries) => {
      for (const entry of entries) {
        const width = clamp(
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
            entry.contentBoxSize[0].inlineSize * devicePixelRatio,
          1,
          device.limits.maxTextureDimension2D,
        );
        const height = clamp(
          entry.devicePixelContentBoxSize?.[0].blockSize ||
            entry.contentBoxSize[0].blockSize * devicePixelRatio,
          1,
          device.limits.maxTextureDimension2D,
        );
        const aspect = width / height;
        setDimensions((prev) =>
          prev && prev.width === width && prev.height === height
            ? prev
            : { width, height, aspect },
        );
      }
    });

    try {
      observer.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(canvas, { box: "content-box" });
    }
  });

  return (
    <Layer name={props.label}>
      <canvas
        ref={canvasRef}
        style={{
          minBlockSize: 0,
          minInlineSize: 0,
          minHeight: 0,
          minWidth: 0,
          flexGrow: props.flexBasis ?? 1,
          flexShrink: props.flexBasis ?? 1,
          backgroundColor: props.flexBasis ? "red" : "blue",
        }}
      >
        {props.children}
      </canvas>
      {data && dimensions && (
        <Inner
          {...props}
          canvas={data.canvas}
          context={data.context}
          format={data.format}
          width={dimensions.width}
          height={dimensions.height}
          aspect={dimensions.aspect}
        />
      )}
    </Layer>
  );
};

export const Inner: FC<
  Props & {
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
    width: number;
    height: number;
    aspect: number;
  }
> = ({
  label,
  setCanvases,
  objectBuffer,
  scene,
  globeMesh,
  canvas,
  context,
  format,
  width,
  height,
  aspect,
}) => {
  const device = useGpuDevice();
  const material = useCreateMaterialAsync();
  const viewProjectionBuffer = useCreateBuffer({
    label: "view_projection",
    size: 64 * 3, // 64 for each matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const landscapeShader = useCreateShaderModule({
    label: "landscape",
    code: shader,
  });

  const { depthStencilAttachment, bindGroup, pipeline, projection } =
    useMemo(() => {
      if (!material) return {};

      const layout = BindGroupLayoutBuilder.Create(`${label}_render`)
        .addBuffer(GPUShaderStage.VERTEX, "uniform")
        .addMaterial(GPUShaderStage.FRAGMENT, "2d") // Two bindings - texture and sampler
        .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
        //   .addBuffer(GPUShaderStage.VERTEX, "read-only-storage")
        .build(device);

      const bindGroup = BindGroupBuilder.Create(`${label}_render`, layout)
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
      canvas.width = width;
      canvas.height = height;
      mat4.perspective(projection, Math.PI / 4, aspect, 0.1, 100.0);

      return {
        bindGroup,
        pipeline,
        projection,
        depthStencilAttachment,
        canvas,
        device,
        label,
        viewProjectionBuffer,
        objectBuffer,
        material,
        globeMesh,
        landscapeShader,
      };
    }, [
      canvas,
      width,
      height,
      aspect,
      material,
      device,
      label,
      globeMesh,
      landscapeShader,
      objectBuffer,
      viewProjectionBuffer,
      format,
    ]);

  const renderPassFunc = useMemo(() => {
    if (!bindGroup || !pipeline) return;
    return (commandEncoder: GPUCommandEncoder) => {
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
    };
  }, [
    context,
    bindGroup,
    pipeline,
    projection,
    depthStencilAttachment,
    device,
    globeMesh,
    viewProjectionBuffer,
    scene,
  ]);

  const id = useId();
  useEffect(() => {
    if (renderPassFunc) {
      setCanvases((prev) => {
        const canvasData: CanvasData = {
          id,
          label,
          renderPassFunc: renderPassFunc,
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

  return <></>;
};
