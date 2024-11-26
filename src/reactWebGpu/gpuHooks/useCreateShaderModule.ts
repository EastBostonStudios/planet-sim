import { useEffect, useState } from "react";
import { useLayerName } from "../Layer.js";
import { useGpuDevice } from "../components/GpuDeviceProvider.js";

/**
 * While creating a shader module is synchronous, checking for errors is async.
 * This hook gracefully returns only valid shaders or undefined- meaning that
 * if a shader is hot reloaded while invalid, only the previous, valid shader
 * will be returned.
 * @param label TODOC PAC
 * @param code TODOC PAC
 */
export function useCreateShaderModule({
  label,
  code,
}: GPUShaderModuleDescriptor & { label: string }): GPUShaderModule {
  const device = useGpuDevice();
  const fullName = useLayerName(label);
  const [shaderModuleAndDescriptor, setShaderModuleAndDescriptor] = useState(
    () => {
      console.log(`Loaded "${fullName}" shader`);
      const shaderModule = device.createShaderModule({ label: fullName, code });
      return { fullName, code, shaderModule };
    },
  );

  useEffect(() => {
    const shaderModule = device.createShaderModule({ label: fullName, code });
    shaderModule.getCompilationInfo().then((info) => {
      setShaderModuleAndDescriptor((prev) => {
        if (fullName === prev.fullName && code === prev.code) return prev;
        console.log(info.messages);
        if (info.messages.length > 0) {
          console.error(`Failed to reload "${fullName}" shader module`);
          return prev;
        }
        console.log(`Reloaded "${fullName}" shader module`);
        return { fullName, code, shaderModule };
      });
    });
  }, [device, fullName, code]);

  return shaderModuleAndDescriptor.shaderModule;
}
