// biome-ignore lint/suspicious/noGlobalAssign: Web Worker
onmessage = () => {
  const numTris = 10000000;
  const arr = new Float32Array(numTris);
  for (let i = 0; i < arr.length; i++) {
    const x = (i % 1000) - 500;
    const y = i / 1000 - 500;
    arr[i * 9] = x;
    arr[i * 9 + 1] = y;
    arr[i * 9 + 2] = 0;

    arr[i * 9 + 3] = x + 1;
    arr[i * 9 + 4] = y;
    arr[i * 9 + 5] = 0;

    arr[i * 9 + 6] = x + 1;
    arr[i * 9 + 7] = y + 1;
    arr[i * 9 + 8] = 0;
  }
  for (let i = 0; i < arr.length; i++) {
    arr[i] /= 10.0;
  }
  postMessage(arr);
  // postMessage(new THREE_WEBGPU.StorageBufferAttribute(arr, 3));
};
