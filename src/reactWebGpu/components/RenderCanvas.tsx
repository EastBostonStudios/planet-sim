import React, { type FC, type ReactNode, useRef, useState } from "react";
import { clamp } from "../../webGpu/math.js";
import { Layer } from "../Layer.js";
import { RenderCanvasContext } from "../gpuHooks/useRenderCanvas.js";
import { useFireOnce } from "../reactHooks/useFireOnce.js";
import { useGpuDevice } from "./GpuDeviceProvider.js";

export const RenderCanvas: FC<{
  name: string;
  flexBasis?: number;
  children?: ReactNode;
}> = (props) => {
  const device = useGpuDevice();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<{
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
    setData({ context, format });

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
        setDimensions((prev) => {
          if (prev && prev.width === width && prev.height === height)
            return prev;
          canvas.width = width;
          canvas.height = height;
          return { width, height, aspect };
        });
      }
    });

    try {
      observer.observe(canvas, { box: "device-pixel-content-box" });
    } catch {
      observer.observe(canvas, { box: "content-box" });
    }
  });

  return (
    <Layer name={props.name}>
      {
        // TODO: this styling logic doesn't quite work
      }
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
        <RenderCanvasContext.Provider
          value={!data || !dimensions ? undefined : { ...data, ...dimensions }}
        >
          {props.children}
        </RenderCanvasContext.Provider>
      </canvas>
    </Layer>
  );
};
