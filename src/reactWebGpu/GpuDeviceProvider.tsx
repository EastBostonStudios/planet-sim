import React, {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useRef,
} from "react";
import useFireOnce from "./useFireOnce.js";

const GpuDeviceContext = createContext<GPUDevice | undefined>(undefined);

export const GpuDeviceProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const isLoadingRef = useRef(false);
  const device = useFireOnce(async () => {
    isLoadingRef.current = true;
    console.log("ASDF");
    if (!navigator.gpu) throw new Error("WebGPU not supported!");

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("WebGPU adapter not provided!");

    const device = await adapter.requestDevice();
    if (!device) throw new Error("WebGPU device unavailable!");
    return device;
  });

  return (
    <GpuDeviceContext.Provider value={device}>
      {!device ? null : children}
    </GpuDeviceContext.Provider>
  );
};

export const useGpuDevice = () => {
  const device = useContext(GpuDeviceContext);
  if (!device)
    throw new Error("useGpuDevice() must be used within GpuDeviceProvider");
  return device;
};
