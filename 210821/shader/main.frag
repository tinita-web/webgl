precision mediump float;

uniform vec4 globalColor;
uniform float power; // 発光係数 @@@

varying vec4 vColor;
varying float vTime;

void main(){
    // テクスチャを参照するのではなく、シェーダ内で動的に模様を作る @@@
    // １．gl_PointCoord.st の原点を中心に移動させる
    vec2 p = gl_PointCoord.st * 2.0 - 1.0;
    // ２．原点からの距離を測る
    float len = length(p);
    float powv = 0.5;
    float area = pow(abs(p.x),powv)+ pow(abs(p.y),powv);
    float daia = 1.0 - smoothstep(0.3,1.0,area);
    daia *= sin(vTime * 2.0) * 2.0;

    daia *= 2.0;


    gl_FragColor = vec4(vec3(daia), 1.0) * globalColor * vColor;
}

