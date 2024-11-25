import { useEffect, useRef, useState } from "react";
import { useGpuDevice } from "../GpuDeviceProvider.js";

export function useCreateBuffer({ label, size, usage }: GPUBufferDescriptor) {
  const device = useGpuDevice();
  const [buffer, setBuffer] = useState<GPUBuffer>();
  const isCreatingBufferRef = useRef(false);

  useEffect(() => {
    if (!isCreatingBufferRef.current) {
      isCreatingBufferRef.current = true;
      console.log(`Allocated "${label}" buffer`);
      setBuffer(device.createBuffer({ label, size, usage }));
    }
  }, [device, label, size, usage]);

  return buffer;
}
