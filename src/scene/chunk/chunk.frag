//----------------------------------------------------------------------------------------------------------------------

varying vec3 v_abc;
varying vec2 v_uv;

//----------------------------------------------------------------------------------------------------------------------

void main() {
    if (abs(v_uv.x) > 180.0) discard;

    gl_FragColor = vec4(fract(v_uv / 45.0), 0.0, 1.0);
    //gl_FragColor = vec4(v_abc, 1.0);
    //if ((v_abc.g*v_abc.g +v_abc.b*v_abc.b) > (v_abc.r*v_abc.r))
    //    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}