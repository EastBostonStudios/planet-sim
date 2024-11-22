struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ObjectData {
    model: array<mat4x4<f32>>
}

struct TileData {
    data: array<f32>
}

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;
@binding(3) @group(0) var<storage, read> objects: ObjectData;
@binding(4) @group(0) var<storage, read> tileData: TileData;

struct Vertex {
  @location(0) position: vec3<f32>,
  @location(1) uv: vec2<f32>
};

struct Fragment {
    @builtin(position) position : vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) tileData : f32
};

@vertex
fn vs_main(
    @builtin(instance_index) instance_index: u32,
    @builtin(vertex_index) vertex_index : u32,
    vert: Vertex) -> Fragment {

    var output : Fragment;
    output.position = tileData.data[instance_index]*
        transformUBO.projection *
        transformUBO.view *
        objects.model[instance_index] *
        vec4<f32>(vert.position, 1.0);
    output.uv = vert.uv;
    output.tileData = tileData.data[vertex_index];

    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {
    return frag.tileData * textureSample(myTexture, mySampler, frag.uv);
}