import React, { useLayoutEffect, useRef, useState } from "react";
import { Game } from "./model/game.js";
import { Renderer, requestRenderResources } from "./view/renderer.js";

export const WebGPUApp = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();

  useLayoutEffect(() => {
    setGame((prev) => {
      if (!ref.current || prev) return prev;
      return requestRenderResources(ref.current).then((resources) => {
        const renderer = new Renderer(resources);
        const newGame = new Game(renderer);
        renderer.Initialize().then(() => newGame.run());
        return newGame;
      });
    });
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    />
  );
};
