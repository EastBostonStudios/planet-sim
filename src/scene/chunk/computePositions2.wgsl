fn compute(
    position_buffer: ptr<storage, array<vec3<f32>>, read_write>,
    time: f32) -> void {
    var foo : f32 = f32(instanceIndex);
    (*position_buffer)[instanceIndex] = (*position_buffer)[instanceIndex] + 0.0005 * (foo % 3.0 + 2.0) * vec3(1.0, 0.0, 0.0) * sin(time);
}
