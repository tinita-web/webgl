precision mediump float;

uniform vec4 globalColor;
uniform float power; // 発光係数 @@@

void main(){
    // テクスチャを参照するのではなく、シェーダ内で動的に模様を作る @@@
    // １．gl_PointCoord.st の原点を中心に移動させる
    vec2 p = gl_PointCoord.st * 2.0 - 1.0;
    // ２．原点からの距離を測る
    float len = length(p);
    // ３．光ったような効果を得たいのでベクトルの長さを除数として使う
    float dest = power / len;
    // ４－１．外縁は完全に透明になってほしいので原点から遠いほど暗くする
    dest *= max(1.0 - len, 0.0);
    // ４－２．または、べき算を活用する
    // dest = pow(dest, 5.0);

    gl_FragColor = vec4(vec3(dest), 1.0) * globalColor;
}

