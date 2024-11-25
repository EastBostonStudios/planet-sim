import { useEffect, useState } from "react";

/**
 * While creating a shader module is synchronous, checking for errors is async.
 * This hook gracefully returns only valid shaders or undefined- meaning that
 * if a shader is hot reloaded while invalid, only the previous, valid shader
 * will be returned.
 * @param label TODOC PAC
 * @param device TODOC PAC
 * @param code TODOC PAC
 */
export const useShaderModule = (
  label: string,
  device: GPUDevice | undefined,
  code: string | undefined,
) => {
  const [shaderModule, setShaderModule] = useState<GPUShaderModule>();

  useEffect(() => {
    if (!device || !code) return;
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
  }, [label, device, code]);

  return shaderModule;
};
