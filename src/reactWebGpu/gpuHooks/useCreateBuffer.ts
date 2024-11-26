import { useEffect, useState } from "react";
import { useLayerName } from "../../Layer.js";
import { useGpuDevice } from "../components/GpuDeviceProvider.js";

export function useCreateBuffer({
  label,
  size,
  usage,
}: Required<GPUBufferDescriptor>): GPUBuffer {
  const device = useGpuDevice();
  const fullName = useLayerName(label);
  const [bufferAndDescriptor, setBufferAndDescriptor] = useState(() => {
    console.log(`Allocated "${fullName}" buffer`);
    const buffer = device.createBuffer({ label: fullName, size, usage });
    return { fullName, size, usage, buffer };
  });

  useEffect(() => {
    setBufferAndDescriptor((prev) => {
      if (
        fullName === prev.fullName &&
        size === prev.size &&
        usage === prev.usage
      )
        return prev;
      console.log(`Reallocated "${fullName}" buffer`);
      const buffer = device.createBuffer({ label: fullName, size, usage });
      return { fullName, size, usage, buffer };
    });
  }, [device, fullName, size, usage]);

  return bufferAndDescriptor.buffer;
}
