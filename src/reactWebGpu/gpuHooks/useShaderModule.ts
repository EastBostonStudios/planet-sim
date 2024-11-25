import { useEffect, useRef, useState } from "react";
import { useGpuDevice } from "../components/GpuDeviceProvider.js";

/**
 * While creating a shader module is synchronous, checking for errors is async.
 * This hook gracefully returns only valid shaders or undefined- meaning that
 * if a shader is hot reloaded while invalid, only the previous, valid shader
 * will be returned.
 * @param label TODOC PAC
 * @param code TODOC PAC
 */
export function useShaderModule({ label, code }: GPUShaderModuleDescriptor) {
  const device = useGpuDevice();
  const [shaderModule, setShaderModule] = useState<GPUShaderModule>();
  const lastHashRef = useRef("");

  useEffect(() => {
    const newHash = `${label}|${code}`;
    if (!code || lastHashRef.current === newHash) return;
    lastHashRef.current = newHash;

    const module = device.createShaderModule({ label, code });
    module.getCompilationInfo().then((info) => {
      setShaderModule((prev) => {
        if (info.messages.length > 0) {
          console.error(
            `Failed to ${!prev ? "load" : "reload"} "${label}" shader module`,
          );
          return prev;
        }
        console.log(
          `${!prev ? "Loaded" : "Reloaded"} "${label}" shader module`,
        );
        return module;
      });
    });
  }, [device, label, code]);

  return shaderModule;
}
