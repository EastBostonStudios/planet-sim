//------------------------------------------------------------------------------

uniform vec3 v_face_a;
uniform vec3 v_face_b;
uniform vec3 v_face_c;

uniform vec2 v_face_a_2d;
uniform vec2 v_face_b_2d;
uniform vec2 v_face_c_2d;

attribute uint region_id;

varying vec3 v_abc;
varying vec2 v_uv;

//flat varying uint v_region_id;

#define M_PI 3.1415926535897932384626433832795
#define M_THETA (M_PI + 1.0172219678840608)

#define M_SQRT_2 (1.41421356237)

//------------------------------------------------------------------------------

void main() {
    v_abc =vec3(
        step(float((gl_VertexID + 0) % 3), 0.5),
        step(float((gl_VertexID + 1 ) % 3), 0.5),
        step(float((gl_VertexID + 2 ) % 3), 0.5)
    );
    v_uv = uv;

    /*
   // v_region_id = region_id;
    vec3 ab = mix(v_face_a, v_face_b, position.x);
    vec3 ca = mix(v_face_a, v_face_c, position.x);
    vec3 p3d = mix(ab, ca, position.y / position.x);

    vec2 ab2 = mix(v_face_a_2d, v_face_b_2d, position.x);
    vec2 ca2 = mix(v_face_a_2d, v_face_c_2d, position.x);
    vec2 p = mix(ab2, ca2, position.y / position.x);

    float theta = p.x * M_PI / 180.0;
    float phi = p.y * M_PI / 180.0;

    float lng = theta;
    float lat = phi;
    vec3 position3D = vec3(
        cos(lat) * cos(lng),
        sin(lat),
        cos(lat) * sin(lng)
    );

    vec3 position2D = vec3(
         theta * cos(phi),
        phi,
        0.0);
    */

    /*
    vec3 position2 = vec3(
        position.x * cos(M_THETA) -
        position.y * sin(M_THETA),
        position.x * sin(M_THETA) +
        position.y * cos(M_THETA),
        position.z
    );
    */
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}