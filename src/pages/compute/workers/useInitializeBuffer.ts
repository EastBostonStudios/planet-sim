import { useEffect, useState } from "react";
import MyWorker from "./setup.worker?worker";

import { StorageBufferAttribute } from "three/webgpu";

export const useInitializeBuffer = () => {
  const [positionBuffer, setPositionBuffer] =
    useState<StorageBufferAttribute>();

  useEffect(() => {
    const worker = new MyWorker();
    worker.onmessage = async (message) => {
      worker.terminate();
      setPositionBuffer(new StorageBufferAttribute(message.data, 3));
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
