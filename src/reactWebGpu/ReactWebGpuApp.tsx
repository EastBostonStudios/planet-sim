import React, { type FC, useEffect, useMemo, useState } from "react";
import { mat4Size, mat4x4Size } from "../webGpu/math.js";
import { Scene } from "../webGpu/model/scene.js";
import { GlobeMesh } from "../webGpu/view/meshes/globeMesh.js";
import {
  GpuDeviceProvider,
  useGpuDevice,
} from "./components/GpuDeviceProvider.js";
import { type CanvasData, WebGPUCanvas } from "./components/WebGPUCanvas.js";
import { useCreateBuffer } from "./gpuHooks/useCreateBuffer.js";

export const ReactWebGpuApp: FC = () => {
  return (
    <GpuDeviceProvider>
      <Main />
    </GpuDeviceProvider>
  );
};

const Main: FC = () => {
  const device = useGpuDevice();
  /*const buffer1 = useCreateBuffer({
    label: "myBuffer",
    size: 10,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });*/

  const [counter, setCounter] = useState(0);
  const [canvases, setCanvases] = useState<Array<CanvasData>>([]);
  const scene = useMemo(() => new Scene(), []);
  const globeMesh = useMemo(() => new GlobeMesh(device), [device]);

  // TODO: how should we read out of CPU-readable buffers? Should there be a
  //  readBufferAsync() method? (Since we have to call mapAsync()? Should that
  //  be done every frame anyways?
  // TODO: can we make ping-pong buffers more straightforward to create and use?
  const objectBuffer = useCreateBuffer({
    label: "object_buffer",
    size: mat4x4Size(1024), // Space for up to this many objects
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  useEffect(() => {
    // TODO: This is extremely gross and should be abstracted into a "GameLoop" class
    //  with a "SimLoop" and a "RenderLoop" (well, multiple render loops- one per canvas)
    if (!objectBuffer) return;
    //--------------------------------------------------------------------------
    // Calculate the camera view and projection matrices

    // Write the object matrix buffer to the GPU
    device.queue.writeBuffer(
      objectBuffer,
      0,
      scene.objectData,
      0,
      mat4Size(1 /* Only write one globe */),
    );

    scene.update();

    const commandEncoder = device.createCommandEncoder();
    if (!commandEncoder) return;
    for (const canvas of canvases) {
      //    console.log({ commandEncoder });
      canvas.renderPassFunc(commandEncoder);
    }
    device.queue.submit([commandEncoder.finish()]);
    //    console.log("rendering", counter, canvases);

    setTimeout(() => setCounter((prev) => prev + 1), 10);
  }, [scene, device, canvases, counter, objectBuffer]);

  return (
    scene &&
    objectBuffer && (
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            minWidth: 0,
            minHeight: 0,
            flexBasis: "3.4",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <WebGPUCanvas
            label="canvas_1"
            setCanvases={setCanvases}
            objectBuffer={objectBuffer}
            scene={scene}
            globeMesh={globeMesh}
          />
          <WebGPUCanvas
            label="canvas_2"
            flexBasis={0.5}
            setCanvases={setCanvases}
            objectBuffer={objectBuffer}
            scene={scene}
            globeMesh={globeMesh}
          />
        </div>
        <div
          style={{
            minWidth: 0,
            minHeight: 0,
            flexBasis: "1.2",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <WebGPUCanvas
            label="canvas_3"
            flexBasis={0.9}
            setCanvases={setCanvases}
            objectBuffer={objectBuffer}
            scene={scene}
            globeMesh={globeMesh}
          />
          <WebGPUCanvas
            label="canvas_4"
            setCanvases={setCanvases}
            objectBuffer={objectBuffer}
            scene={scene}
            globeMesh={globeMesh}
          />
          <WebGPUCanvas
            label="canvas_5"
            flexBasis={0.5}
            setCanvases={setCanvases}
            objectBuffer={objectBuffer}
            scene={scene}
            globeMesh={globeMesh}
          />
        </div>
      </div>
    )
  );
};

//--------------------------------------------------------------------------