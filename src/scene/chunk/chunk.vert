//------------------------------------------------------------------------------

attribute uint region_id;

varying vec3 v_abc;
//flat varying uint v_region_id;

#define M_PI 3.1415926535897932384626433832795
#define M_THETA (M_PI + 1.0172219678840608)

//------------------------------------------------------------------------------

void main() {
    v_abc =vec3(
        step(float((gl_VertexID + 0) % 3), 0.5),
        step(float((gl_VertexID + 1 ) % 3), 0.5),
        step(float((gl_VertexID + 2 ) % 3), 0.5)
    );

   // v_region_id = region_id;

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