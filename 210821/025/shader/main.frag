precision mediump float;

uniform sampler2D textureUnit;
uniform vec4 globalColor;

void main(){
    vec4 samplerColor = texture2D(textureUnit, gl_PointCoord.st);

    gl_FragColor = samplerColor * globalColor;
}

