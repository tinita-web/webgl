
// = 005 ======================================================================
// 五角形を自分で地道に頂点定義して作成してみると、three.js ではメソッドひとつで
// 簡単にいろんな形状のジオメトリ作ってくれてすげえな！ という気持ちになったので
// はないでしょうか。
// しかし、頂点定義（ジオメトリの定義）については、もうひとつ、重要なトピックが
// あります。それがインデックスバッファ（IBO）の存在です。
// 実際に自分で頂点を定義してみると、まったく同じ座標に複数の頂点を配置する必要
// があったりして、すごく効率が悪いと感じた方もいたのではないかと思います。これ
// を解消する手段として「定義した順番（連番）をインデックスとして再利用する」と
// いう方法を提供してくれるのがインデックスバッファです。
// 一般に、頂点の数が少なくて済むなどの理由から、インデックスバッファを用いたほ
// うがパフォーマンスが良くなるなどと言われることがあります。実際には、もし仮に
// インデックスバッファを使っていなくても大きな問題になることはほぼありませんが
// 仕組みとしては知っておくべきだと思いますので、まずは体験してみましょう。
// ============================================================================
//https://torajiro.halfmoon.jp/old/exhosi.html
(() => {
    // 複数の関数で利用する広いスコープが必要な変数を宣言しておく
    let position = [];
    let color = [];
    let vbo = null;
    let indices = null; // インデックス配列 @@@
    let ibo = null;     // インデックスバッファ @@@
    let uniform = null;
    let mouse = [0, 0];

    const n = 10; //頂点数
    const r_out = 1.0;　//外側の円の半径のサイズ
    const r_in= r_out * 0.382; //スポーク比の設定
    let R;  //半径の変数
    

    // webgl.js に記載のクラスをインスタンス化する
    const webgl = new WebGLUtility();

    // ドキュメントの読み込みが完了したら実行されるようイベントを設定する
    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('webgl-canvas');
        webgl.initialize(canvas);
        const size = Math.min(window.innerWidth, window.innerHeight);
        webgl.width  = size;
        webgl.height = size;

        // マウスカーソルが動いた際のイベントを登録しておく
        window.addEventListener('mousemove', (event) => {
            mouse[0] = event.clientX / window.innerWidth;
            mouse[1] = event.clientY / window.innerHeight;
        }, false);

        let vs = null;
        let fs = null;
        WebGLUtility.loadFile('./shader/main.vert')
        .then((vertexShaderSource) => {
            vs = webgl.createShaderObject(vertexShaderSource, webgl.gl.VERTEX_SHADER);
            return WebGLUtility.loadFile('./shader/main.frag');
        })
        .then((fragmentShaderSource) => {
            fs = webgl.createShaderObject(fragmentShaderSource, webgl.gl.FRAGMENT_SHADER);
            webgl.program = webgl.createProgramObject(vs, fs);

            // calcPoints();
            // 頂点とロケーションのセットアップは先に行っておく
            setupGeometry();
            setupLocation();

            // 準備ができたらレンダリングを開始
            render();
        });
    }, false);

    /**
     * 頂点属性（頂点ジオメトリ）のセットアップを行う
     */
    function setupGeometry(){
            let x;
            let y;
            for (let i = 0; i < n; i++) {
                if (i%2 == 0) {
                        R = r_out;　//頂点が偶数の場合
                } else {
                        R = r_in; //頂点が奇数の場合
                }
                x=(R*Math.cos((360/n * i + 18) * ( Math.PI / 180 )));　//x座標取得　
                y=(R*Math.sin((360/n * i + 18) * ( Math.PI / 180 )));　//y座標取得
                position.push(x, y, 0.0);
                if(x > 0){
                    color.push((y+1)*0.5, x, 0.0, 1.0);
                }else{
                    color.push((y+1)*0.5, 0.0, -x, 1.0);
                }
            }
            console.log(position);
            vbo = [
            webgl.createVBO(position),
            webgl.createVBO(color),
        ];

        // インデックス配列で頂点の結ぶ順序を定義する @@@
        indices = [
            1, 2, 3,
            3, 1, 7,
            3, 4, 5,
            5, 3, 7,
            5, 6, 7,
            7, 8, 9,
            9, 0, 1,
            1, 7, 9,
        ];
        // インデックスバッファを生成する @@@
        ibo = webgl.createIBO(indices);

    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    function setupLocation(){
        const gl = webgl.gl;
        // attribute location の取得と有効化
        const attLocation = [
            gl.getAttribLocation(webgl.program, 'position'),
            gl.getAttribLocation(webgl.program, 'color'),
        ];
        const attStride = [3, 4];
        webgl.enableAttribute(vbo, attLocation, attStride);

        // インデックスバッファのバインド @@@
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        // uniform 変数のロケーションを取得する
        uniform = {
            mouse: gl.getUniformLocation(webgl.program, 'mouse'),
        };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    function setupRendering(){
        const gl = webgl.gl;
        gl.viewport(0, 0, webgl.width, webgl.height);
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /**
     * レンダリングを行う
     */
    function render(){
        const gl = webgl.gl;

        // 再帰呼び出しを行う
        requestAnimationFrame(render);

        // レンダリング時のクリア処理など
        setupRendering();

        // uniform 変数は常に変化し得るので毎フレーム値を送信する
        gl.uniform2fv(uniform.mouse, mouse);

        // 登録されている VBO と IBO を利用して描画を行う @@@
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
})();

