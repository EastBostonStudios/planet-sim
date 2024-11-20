import React, { useLayoutEffect, useRef, useState } from "react";
import { Renderer } from "./Renderer.js";

export const WebGPUApp = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<Renderer>();

  useLayoutEffect(() => {
    setRenderer((prev) => {
      if (!ref.current) return undefined;
      if (prev) return prev;

      const renderer = new Renderer(ref.current);
      renderer.Initialize().then(() => console.log("Initialized"));
      return renderer;
    });
  }, []);

  return <canvas ref={ref} width={500} height={500} />;
};
