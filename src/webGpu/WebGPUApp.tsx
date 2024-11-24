import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createComputePass } from "./init/createComputePass.js";
import { createTerrainRenderPass } from "./init/createTerrainRenderPass.js";
import { type GpuBuffers, allocateGpuBuffers } from "./init/gpuBuffers.js";
import {
  type GpuResources,
  requestGpuResources,
} from "./init/requestGpuResources.js";
import {
  type ScreenSpaceBuffers,
  allocateScreenSpaceBuffers,
} from "./init/screenSpaceBuffers.js";
import { clamp } from "./math.js";
import { Scene } from "./model/scene.js";
import { Renderer } from "./view/renderer.js";

export const WebGPUApp = () => {
  //----------------------------------------------------------------------------

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gpuResources, setGpuResources] = useState<GpuResources>();
  const [gpuBuffers, setGpuBuffers] = useState<GpuBuffers>();
  const [screenSpaceBuffers, setScreenSpaceBuffers] =
    useState<ScreenSpaceBuffers>();
  const scene = useMemo<Scene>(() => new Scene(), []);

  const [forwardsAmount, setForwardsAmount] = useState<number>(0);
  const [rightAmount, setRightAmount] = useState<number>(0);
  const [running, setIsRunning] = useState<boolean>(true);

  //----------------------------------------------------------------------------

  useLayoutEffect(() => {
    if (!canvasRef.current || !!gpuResources) return;
    canvasRef.current.focus();
    requestGpuResources(canvasRef.current).then((r) => {
      console.log("Retrieved GPU resources:", r);
      setGpuResources(r);
    });
  }, [gpuResources]);

  useEffect(() => {
    if (!gpuResources) return;
    allocateGpuBuffers(gpuResources).then((b) => {
      console.log("Allocated buffers:", b);
      setGpuBuffers(b);
    });

    // Stolen code to support canvas resizing
    const observer = new ResizeObserver(async (entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;
        const maxSize = gpuResources.device.limits.maxTextureDimension2D;
        allocateScreenSpaceBuffers(
          gpuResources,
          clamp(width, 1, maxSize),
          clamp(height, 1, maxSize),
        ).then((b) => {
          setScreenSpaceBuffers(() => {
            console.log("Reallocated screen space buffers:", b);
            return b;
          });
        });
      }
    });
    try {
      observer.observe(gpuResources.canvas, {
        box: "device-pixel-content-box",
      });
    } catch {
      observer.observe(gpuResources.canvas, { box: "content-box" });
    }
  }, [gpuResources]);

  //----------------------------------------------------------------------------

  const [renderer, setRenderer] = useState<Renderer>();

  useEffect(() => {
    try {
      if (!gpuResources || !gpuBuffers || !screenSpaceBuffers) return;
      const computePipeline = createComputePass(gpuResources, gpuBuffers);
      const renderPipeline = createTerrainRenderPass(
        gpuResources,
        gpuBuffers,
        screenSpaceBuffers,
      );
      setRenderer((prev) => {
        if (!prev) {
          console.log("Created renderer");
          return new Renderer(
            gpuResources,
            gpuBuffers,
            screenSpaceBuffers,
            computePipeline,
            renderPipeline,
            scene,
          );
        }
        console.log("Reloaded renderer");
        return prev;
      });
    } catch (e) {
      console.error("FOO", e);
    }
  }, [gpuResources, gpuBuffers, screenSpaceBuffers, scene]);

  useEffect(() => {
    if (renderer) {
      renderer.running = true;
    }
  }, [renderer]);

  /*
const gpuTimeRef = useRef(Number.NaN);
const renderLoop = useCallback(async () => {
  if (!renderer) return;

  const startTime = performance.now();
  scene.update();
  await renderer.render(scene);
  gpuTimeRef.current = performance.now() - startTime;
  // console.log(gpuTimeRef.current * 1000.0);
}, [renderer, running, scene]);

useEffect(() => {
  if (!renderer || !running) return;
  renderLoop();
}, [renderer, running, renderLoop]);
*/

  //----------------------------------------------------------------------------

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", width: "100%", height: "100%" }}
      onKeyDown={(event) => {
        if (event.code === "KeyW") setForwardsAmount(0.02);
        else if (event.code === "KeyS") setForwardsAmount(-0.02);
        else if (event.code === "KeyA") setRightAmount(-0.02);
        else if (event.code === "KeyD") setRightAmount(0.02);
        else if (event.code === "Space") if (renderer) renderer.running = false;
        scene.move_player(forwardsAmount, rightAmount);
      }}
      onKeyUp={(event) => {
        if (event.code === "KeyW") setForwardsAmount(0);
        else if (event.code === "KeyS") setForwardsAmount(0);
        else if (event.code === "KeyA") setRightAmount(0);
        else if (event.code === "KeyD") setRightAmount(0);
        else if (event.code === "Space") if (renderer) renderer.running = true;
      }}
      onMouseMove={(event) =>
        scene.spin_player(event.movementX / 5, event.movementY / 5)
      }
    />
  );
};