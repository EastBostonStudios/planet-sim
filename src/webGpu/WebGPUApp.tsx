import React, { useLayoutEffect, useRef } from "react";
import { Renderer } from "./Renderer.js";

export const WebGPUApp = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const renderer = new Renderer(ref.current);
      renderer.Initialize().then();
    }
  }, []);

  return <canvas ref={ref} width={500} height={500} />;
};
