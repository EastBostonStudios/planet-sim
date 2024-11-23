@binding(0) @group(0) var myTexture: texture_2d<f32>;
@binding(1) @group(0) var mySampler: sampler;

struct Fragment {
    @builtin(position) position : vec4<f32>,
    @location(0) uv : vec2<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) vertex_index : u32) -> Fragment {
    // A fixed triangle in 2D space to render onto. Why a triangle? See:
    // https://webgpufundamentals.org/webgpu/lessons/webgpu-large-triangle-to-cover-clip-space.html
    const pos = array(
      vec2(-1.0, 3.0),
      vec2(3.0, -1.0),
      vec2(-1.0, -1.0),
    );
    const uv = array(
      vec2(0.0, 0.0),
      vec2(2.0, 2.0),
      vec2(0.0, 2.0),
    );

    var output : Fragment;
    output.position = vec4(pos[vertex_index], 0.0, 1.0);
    output.uv = uv[vertex_index];
    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {
    return textureSample(myTexture, mySampler, frag.uv).bgra;
}