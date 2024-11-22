import React, { useLayoutEffect, useRef, useState } from "react";
import { Game } from "./model/game.js";

export const WebGPUApp = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();

  useLayoutEffect(() => {
    setGame((prev) => {
      if (!ref.current || prev) return prev;

      const newGame = new Game(ref.current);
      newGame.Initialize().then(() => newGame.run());
      return newGame;
    });
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", width: "100%", height: "100%" }}
    />
  );
};
