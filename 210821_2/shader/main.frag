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
    //時間経過で大きさを変化させるため少数をとる
    float val1 = mod(-vTime,1.0);
    float val = max(val1*3.0 ,0.8) * 2.0;
    float x = p.x * -val;
    float y = p.y * -val;
    //https://itchyny.hatenablog.com/entry/20130214/1360847516
    float area1inner = pow(x,2.0) + pow(y,2.0) - 1.0;
    float area1 = pow(area1inner,3.0);
    float area2 = pow(x,2.0) * pow(y,3.0);
    float heart = step(area1,area2);
    //時間経過でフェードする
    float fade = pow(val1,0.5);



    gl_FragColor = vec4(vec3(heart), fade) * globalColor * vColor;
}

