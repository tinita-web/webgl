attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord; // テクスチャ座標 @@@

uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;

varying vec3 vNormal;
varying vec2 vTexCoord;

void main(){
    // 法線を行列で変換してからフラグメントシェーダに送る
    vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;

    // テクスチャ座標をフラグメントシェーダに送る @@@
    vTexCoord = texCoord;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}

