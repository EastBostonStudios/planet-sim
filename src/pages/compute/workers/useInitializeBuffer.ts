import { useEffect, useState } from "react";
import MyWorker from "./setup.worker?worker";

import * as THREE_WEBGPU from "three/webgpu";

export const useInitializeBuffer = () => {
  const [positionBuffer, setPositionBuffer] =
    useState<THREE_WEBGPU.StorageBufferAttribute>();

  useEffect(() => {
    const worker = new MyWorker();
    worker.onmessage = async (message) => {
      worker.terminate();
      setPositionBuffer(
        new THREE_WEBGPU.StorageBufferAttribute(message.data, 3),
      );
    };
    worker.onerror = async (error) => {
      worker.terminate();
      console.error(error);
    };
    worker.postMessage({});
    return;
  }, []);

  return positionBuffer;
};
