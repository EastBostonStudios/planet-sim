fn compute(
    input_position_buffer: ptr<storage, array<vec3<f32>>, read>,
    output_position_buffer: ptr<storage, array<vec3<f32>>, read_write>,
    time: f32,
    thing: f32) -> void {
    var foo : f32 = f32(instanceIndex);
    (*output_position_buffer)[instanceIndex] =
     (*input_position_buffer)[instanceIndex] + thing * (foo % 3.0) / 3.0 * vec3(-1.0, 0.0, 0.0) * (0.5 + 0.5 * sin(time));
}
