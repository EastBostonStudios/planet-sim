import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type RenderAssets, createAssets } from "./init/createAssets.js";
import {
  type RenderResources,
  requestRenderResources,
} from "./init/requestRenderResources.js";
import { Scene } from "./model/scene.js";
import { Renderer } from "./view/renderer.js";

export const WebGPUApp = () => {
  //----------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderResources, setRenderResources] = useState<RenderResources>();
  const [renderAssets, setRenderAssets] = useState<RenderAssets>();
  const scene = useMemo<Scene>(() => new Scene(), []);
  const [renderer, setRenderer] = useState<Renderer>();

  const [forwardsAmount, setForwardsAmount] = useState<number>(0);
  const [rightAmount, setRightAmount] = useState<number>(0);
  const [running, setIsRunning] = useState<boolean>(true);

  //----------------------------------------------------------------------------

  useLayoutEffect(() => {
    if (!canvasRef.current || !!renderResources) return;
    canvasRef.current.focus();
    requestRenderResources(canvasRef.current).then((r) => {
      console.log("Retrieved rendering resources:", r);
      setRenderResources(r);
    });
  }, [renderResources]);

  useEffect(() => {
    if (!renderResources) return;
    createAssets(renderResources).then((a) => {
      console.log("Created rendering assets:", a);
      setRenderAssets(a);
    });
  }, [renderResources]);

  useEffect(() => {
    if (!renderResources || !renderAssets) return;
    const renderer = new Renderer(renderResources, renderAssets);
    renderer.Initialize().then((renderer) => {
      console.log("Initialized renderer:", renderer);
      setRenderer(renderer);
    });
  }, [renderResources, renderAssets]);

  const renderLoop = useCallback(async () => {
    if (!renderer) return;
    scene.update();
    await renderer.render(scene);

    if (running) requestAnimationFrame(renderLoop);
  }, [renderer, running, scene]);

  useEffect(() => {
    if (!renderer || !running) return;
    renderLoop();
  }, [renderer, running, renderLoop]);

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
        else if (event.code === "Space") setIsRunning(false);
        scene.move_player(forwardsAmount, rightAmount);
      }}
      onKeyUp={(event) => {
        if (event.code === "KeyW") setForwardsAmount(0);
        else if (event.code === "KeyS") setForwardsAmount(0);
        else if (event.code === "KeyA") setRightAmount(0);
        else if (event.code === "KeyD") setRightAmount(0);
        else if (event.code === "Space") setIsRunning(true);
      }}
      onMouseMove={(event) =>
        scene.spin_player(event.movementX / 5, event.movementY / 5)
      }
    />
  );
};
