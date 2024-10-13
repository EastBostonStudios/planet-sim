//------------------------------------------------------------------------------

uniform vec3 v_face_a;
uniform vec3 v_face_b;
uniform vec3 v_face_c;

uniform vec2 v_face_a_2d;
uniform vec2 v_face_b_2d;
uniform vec2 v_face_c_2d;

uniform bool v_is_3d;
uniform float v_time;

attribute vec2 lng_lat;
attribute uint region_id;

varying vec3 v_abc;
varying vec2 v_lng_lat;

//flat varying uint v_region_id;

#define M_PI 3.1415926535897932384626433832795
#define M_THETA (M_PI + 1.0172219678840608)

#define M_SQRT_2 (1.41421356237)
#define IS_3D 0

//------------------------------------------------------------------------------

void main() {
    v_abc =vec3(
        step(float((gl_VertexID + 0) % 3), 0.5),
        step(float((gl_VertexID + 1 ) % 3), 0.5),
        step(float((gl_VertexID + 2 ) % 3), 0.5)
    );
    v_lng_lat = lng_lat;

    #if (IS_3D == 1)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #else
        // Vector must be normalized!!
        float lat = asin(position.y);
        float lng = fract(1.0 + (atan(position.z, -position.x) / (2.0 * M_PI)) + v_time * 0.1) * 2.0 * M_PI - M_PI;

        /*
        vec3 position2 = vec3(
            -cos(lat) * cos(lng),
            sin(lat),
            cos(lat) * sin(lng)
        );
        */

        vec3 position2 = vec3(
        lng * cos(lat),
        lat,
        -0.0001 * abs(lng) // Hides wrapping
        );
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position2, 1.0);
    #endif

}


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