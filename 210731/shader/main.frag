precision mediump float;

uniform vec3 lightDirection;
uniform sampler2D textureUnit; // 対象となるテクスチャユニット @@@
uniform bool isTexture;        // テクスチャのサンプリングを行うかどうか @@@

varying vec3 vNormal;
varying vec2 vTexCoord;

void main(){
    // ベクトルの単位化
    vec3 light = normalize(lightDirection);
    vec3 normal = normalize(vNormal);

    // 拡散光をハーフランバート風にする
    float diffuse = dot(light, normal) * 0.5 + 0.5;

    // フラグの状態に応じてテクスチャのサンプリング（色の参照と抽出）を行う @@@
    vec4 samplerColor = vec4(1.0);
    vec2 remap = vec2(diffuse, 0.0);
    if(isTexture == true){
        samplerColor = texture2D(textureUnit, remap);
    }

    // 最終出力カラーを合成する
    gl_FragColor = vec4(samplerColor.rgb, 1.0);
}

