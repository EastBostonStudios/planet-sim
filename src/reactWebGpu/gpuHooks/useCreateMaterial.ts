import { useEffect, useState } from "react";
import cat from "../../webGpu/assets/cat.jpg";
import { Material } from "../../webGpu/view/material.js";
import { useGpuDevice } from "../components/GpuDeviceProvider.js";

export const useCreateMaterial = () => {
  const device = useGpuDevice();
  const [material, setMaterial] = useState<Material>();
  useEffect(() => {
    (() => {
      const material = new Material();
      material.initialize(device, cat).then(() => {
        console.log("initialized material!");
        setMaterial(material);
      });
    })();
  }, [device]);

  return material;
};
