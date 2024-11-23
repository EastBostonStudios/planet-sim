@binding(0) @group(0) var<storage, read> size: vec2u;
@binding(1) @group(0) var<storage, read> current: array<f32>;
@binding(2) @group(0) var<storage, read_write> next: array<f32>;

override blockSize = 256;

fn rand(co :f32) -> f32 {
    return fract(sin(dot(vec2(co, co), vec2(12.9898, 78.233))) * 43758.5453);
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x > 0) {
   next[id.x] = max(current[id.x], current[id.x - 1]) + 0.01 *
        rand(f32(id.x));
  }
  if (id.x < size.x - 2) {
   next[id.x] = max(current[id.x], current[id.x - 1]) + 0.01 *
        rand(f32(id.x));
  }
   next[id.x] =  next[id.x] % 1.0;
} 
