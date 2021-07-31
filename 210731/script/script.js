
// = 019 ======================================================================
// three.js のサンプルでも利用した「テクスチャ」をピュアな WebGL で実装するとど
// のような手順になるのか、実際に体験してみましょう。
// テクスチャを導入する場合、覚えなくてはならないことがかなり多く出てきます。そ
// ういう意味では、テクスチャを「完全に理解して使いこなす」のはちょっとだけ大変
// です。
// 最初は、一度に覚えるのは困難な場合が多いので、とにかくじっくり、少しずつ慣れ
// ていくのがよいと思います。
// テクスチャを扱うために、webgl.js 側に新しく追加されたメソッドもありますので、
// 落ち着いて手順を確認していきましょう。
// ============================================================================

(() => {
    // webgl.js に記載のクラスを扱いやすいよう変数に入れておく
    const webgl = new WebGLUtility(); // WebGL API をまとめたユーティリティ
    const math  = WebGLMath;          // 線型代数の各種算術関数群
    const geo   = WebGLGeometry;      // 頂点ジオメトリを生成する関数群

    // 複数の関数で利用する広いスコープが必要な変数を宣言しておく
    let startTime = 0;    // 描画開始時のタイムスタンプ
    let isTexture = true; // テクスチャマッピングを行うかどうか @@@

    let torus       = null; // torusのジオメトリ情報
    let torusVBO    = null; // torus用の VBO
    let torusIBO    = null; // torus用の IBO

    let attLocation = null; // attribute location
    let attStride   = null; // 頂点属性のストライド
    let uniLocation = null; // uniform location

    let vMatrix     = null; // ビュー行列
    let pMatrix     = null; // プロジェクション行列
    let vpMatrix    = null; // ビュー x プロジェクション行列

    let camera      = null; // 自作オービットコントロール風カメラ

    let texture     = null; // テクスチャオブジェクト @@@

    // ドキュメントの読み込みが完了したら実行されるようイベントを設定する
    window.addEventListener('DOMContentLoaded', () => {
        // special thanks! https://github.com/cocopon/tweakpane ===============
        const PANE = new Tweakpane({
            container: document.querySelector('#float-layer'),
        });
        PANE.addInput({'texture-mapping': isTexture}, 'texture-mapping')
        .on('change', (v) => {isTexture = v;});
        // ====================================================================

        const canvas = document.getElementById('webgl-canvas');
        webgl.initialize(canvas);
        webgl.width  = window.innerWidth;
        webgl.height = window.innerHeight;
        window.addEventListener('resize', () => {
            webgl.width  = window.innerWidth;
            webgl.height = window.innerHeight;
        });

        // カメラのインスタンスを生成
        const cameraOption = {
            distance: 5.0,
            min: 1.0,
            max: 10.0,
            move: 2.0,
        };
        camera = new WebGLOrbitCamera(canvas, cameraOption);

        // シェーダの前に、まずはテクスチャ用のリソースを読み込む @@@
        // 空の Image オブジェクト（<img> タグに相当）を生成
        const image = new Image();
        // 画像が読み込み完了した瞬間をフックするために、先にイベントを設定
        image.addEventListener('load', () => {
            // 画像がロードできたので、テクスチャオブジェクトを生成する
            texture = webgl.createTexture(image);
            // 今回はテクスチャを途中で切り替えるわけではないので……
            // ユニット０に対してテクスチャをあらかじめバインドしておく
            webgl.gl.activeTexture(webgl.gl.TEXTURE0);
            webgl.gl.bindTexture(webgl.gl.TEXTURE_2D, texture);

            // シェーダのロードに移行する
            loadShader();
        }, false);
        // イベントを設定してからロードを開始する
        image.src = './gradation.png';
    }, false);

    /**
     * シェーダをロードして、描画へ移行する
     */
    function loadShader(){
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

            setupGeometry();
            setupLocation();
            startTime = Date.now();
            render();
        });
    }

    /**
     * 頂点属性（頂点ジオメトリ）のセットアップを行う
     */
    function setupGeometry(){
        // プレーンジオメトリ情報と VBO、IBO の生成
        torus = geo.torus(64, 64, 0.4, 0.8, [1.0, 1.0, 1.0, 1.0]);
        torusVBO = [
            webgl.createVBO(torus.position),
            webgl.createVBO(torus.normal),
            webgl.createVBO(torus.texCoord), // テクスチャ座標 @@@
        ];
        torusIBO = webgl.createIBO(torus.index);
    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    function setupLocation(){
        const gl = webgl.gl;
        // attribute location の取得と有効化
        attLocation = [
            gl.getAttribLocation(webgl.program, 'position'),
            gl.getAttribLocation(webgl.program, 'normal'),
            gl.getAttribLocation(webgl.program, 'texCoord'), // テクスチャ座標 @@@
        ];
        attStride = [3, 3, 2]; // ストライドは vec2 用に 2 を追加しておく @@@
        // uniform 変数のロケーションの取得
        uniLocation = {
            mvpMatrix: gl.getUniformLocation(webgl.program, 'mvpMatrix'),
            normalMatrix: gl.getUniformLocation(webgl.program, 'normalMatrix'),
            lightDirection: gl.getUniformLocation(webgl.program, 'lightDirection'),
            textureUnit: gl.getUniformLocation(webgl.program, 'textureUnit'), // テクスチャユニット @@@
            isTexture: gl.getUniformLocation(webgl.program, 'isTexture'),     // テクスチャのサンプリングを行うかどうか @@@
        };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    function setupRendering(){
        const gl = webgl.gl;
        gl.viewport(0, 0, webgl.width, webgl.height);
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // プレーンの描画なのでカリングは無効化する @@@
        gl.disable(gl.CULL_FACE);
        // 深度テストは有効
        gl.enable(gl.DEPTH_TEST);

        // ビュー x プロジェクション行列を生成
        vMatrix = camera.update();
        const fovy = 45;
        const aspect = webgl.width / webgl.height;
        const near = 0.1;
        const far = 20.0;
        pMatrix = math.mat4.perspective(fovy, aspect, near, far);
        vpMatrix = math.mat4.multiply(pMatrix, vMatrix);

        // ライトベクトルを uniform 変数としてシェーダに送る
        gl.uniform3fv(uniLocation.lightDirection, [1.0, 1.0, 1.0]);

        // テクスチャユニットの番号をシェーダに送る @@@
        gl.uniform1i(uniLocation.textureUnit, 0);

        // テクスチャを使うかどうかのフラグをシェーダに送る @@@
        gl.uniform1i(uniLocation.isTexture, isTexture);
    }

    /**
     * メッシュ情報の更新と描画を行う
     * @param {number} time - 経過時間
     */
    function renderMesh(time){
        const gl = webgl.gl;

        // プレーンの VBO と IBO をバインドする
        webgl.enableAttribute(torusVBO, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torusIBO);

        // モデル行列を生成してシェーダに送る
        let mMatrix = math.mat4.identity(math.mat4.create());
        mMatrix = math.mat4.rotate(mMatrix, time, [0.0, 1.0, 0.0]);
        mMatrix = math.mat4.rotate(mMatrix, Math.PI / 2, [1.0, 0.0, 0.0]);
        gl.uniformMatrix4fv(uniLocation.mMatrix, false, mMatrix);

        // 法線変換用の行列を生成してシェーダに送る
        const normalMatrix = math.mat4.transpose(math.mat4.inverse(mMatrix));
        gl.uniformMatrix4fv(uniLocation.normalMatrix, false, normalMatrix);

        // mvp 行列を生成してシェーダに送る
        const mvpMatrix = math.mat4.multiply(vpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);

        // バインド中の頂点を描画する
        gl.drawElements(gl.TRIANGLES, torus.index.length, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * レンダリングを行う
     */
    function render(){
        const gl = webgl.gl;

        // 再帰呼び出しを行う
        requestAnimationFrame(render);

        // 時間の計測
        const nowTime = (Date.now() - startTime) / 1000;

        // レンダリング時のクリア処理など
        setupRendering();

        // メッシュを更新し描画を行う
        renderMesh(nowTime);
    }
})();

