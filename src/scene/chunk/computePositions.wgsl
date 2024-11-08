fn compute(
    positionBuffer: ptr<storage, array<vec3<f32>>, read_write>,
    time: f32) -> void {
    var foo : f32 = f32(instanceIndex);
    (*positionBuffer)[instanceIndex] = (*positionBuffer)[instanceIndex] + 0.0005 * (foo % 3.0 + 2.0) * vec3(1.0, 1.0, 1.0) * sin(time);
}
