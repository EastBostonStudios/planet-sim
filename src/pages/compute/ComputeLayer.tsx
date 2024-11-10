import { useFrame } from "@react-three/fiber";
import { folder, useControls } from "leva";
import React, { type FC, useMemo } from "react";
import { storage, uniform, wgslFn } from "three/webgpu";
import type { ComputeBuffers } from "./computeBuffers";
import computePositionsShader from "./gpgpu/compute1.wgsl";
import computePositions2Shader from "./gpgpu/compute2.wgsl";

export const ComputeLayer: FC<ComputeBuffers> = ({
  renderer,
  buffer0,
  buffer1,
}) => {
  const { doFlip, thing } = useControls({
    compute: folder({
      doFlip: false,
      thing: {
        value: 1,
        min: 0,
        max: 2,
      },
    }),
  });

  const params = useMemo(() => {
    const input_position_buffer = storage(
      buffer0,
      "vec3",
      buffer0.count,
    ).toReadOnly();
    const output_position_buffer = storage(buffer1, "vec3", buffer1.count);
    const time = uniform(0);
    const thing = uniform(0);
    return { input_position_buffer, output_position_buffer, time, thing };
  }, [buffer0, buffer1]);

  params.thing.value = thing;

  const { computePositions, computePositions2 } = useMemo(() => {
    // @builtin(global_invocation_id)
    const computeShader = wgslFn(computePositionsShader);
    const compute2Shader = wgslFn(computePositions2Shader);

    const call = computeShader(params);
    const compute = call.compute(buffer0.count, [64]);
    return {
      computePositions: compute,
      computePositions2: compute2Shader(params).compute(buffer0.count, [64]),
    };
  }, [params, buffer0.count]);

  const computeCommands = useMemo(
    () =>
      doFlip
        ? [computePositions]
        : [
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
            computePositions,
            computePositions2,
          ],
    [computePositions, computePositions2, doFlip],
  );

  useFrame(({ clock }) => {
    params.time.value = clock.elapsedTime;
    renderer.compute(computeCommands);
  });

  return <></>;
};
