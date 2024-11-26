import { useEffect, useRef, useState } from "react";
import { useLayerName } from "../../Layer.js";
import { useGpuDevice } from "../components/GpuDeviceProvider.js";

export function useCreateBuffer({
  label,
  size,
  usage,
}: GPUBufferDescriptor & { label: string }) {
  const device = useGpuDevice();
  const fullName = useLayerName(label);
  const [buffer, setBuffer] = useState<GPUBuffer>(() => {
    console.log(`Allocated "${fullName}" buffer`);
    return device.createBuffer({ label: fullName, size, usage });
  });
  const isCreatingBufferRef = useRef(true);

  useEffect(() => {
    if (!isCreatingBufferRef.current) {
      isCreatingBufferRef.current = true;
      console.log(`Reallocated "${fullName}" buffer`);
      setBuffer(device.createBuffer({ label: fullName, size, usage }));
    }
  }, [device, fullName, size, usage]);

  return buffer;
}
