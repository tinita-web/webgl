
// = 025 ======================================================================
// ポイントスプライトを使うと、比較的簡単に「点描画の質感を向上」できて便利です
// が、ここにさらに、有機的で自然な印象を与えるには外見だけでなく「動き」にも工
// 夫を凝らすことが重要です。
// ここでは、頂点に「ランダムな値」という頂点属性を付与することで、頂点シェーダ
// 内部でダイナミックに頂点の座標を変化させてみましょう。
// このテクニックは応用範囲が広いので、頭を柔らかくして考えてみましょう。
// ============================================================================

(() => {
    const webgl = new WebGLUtility(); // WebGL API をまとめたユーティリティ
    const math  = WebGLMath;          // 線型代数の各種算術関数群
    const geo   = WebGLGeometry;      // 頂点ジオメトリを生成する関数群

    // 複数の関数で利用する広いスコープが必要な変数を宣言しておく
    let startTime = 0;                 // 描画開始時のタイムスタンプ
    let globalColor = [0.2, 0.6, 0.9]; // 頂点に適用するマテリアルの色
    let globalAlpha = 0.5;             // 頂点に適用するマテリアルのアルファ
    let pointSize = 16.0;              // 頂点のポイントサイズ

    const POINT_COUNT = 1000; // 生成する頂点の個数
    const POINT_RANGE = 10.0; // 生成する頂点の配置される範囲

    let points      = null; // 頂点データ格納用
    let randomValue = null; // 頂点データ格納用（乱数値用） @@@
    let pointVBO    = null; // 頂点データの VBO
    let attLocation = null; // attribute location
    let attStride   = null; // 頂点属性のストライド
    let uniLocation = null; // uniform location
    let texture     = null; // テクスチャオブジェクト

    let vMatrix     = null; // ビュー行列
    let pMatrix     = null; // プロジェクション行列
    let vpMatrix    = null; // ビュー x プロジェクション行列
    let camera      = null; // 自作オービットコントロール風カメラ

    // ドキュメントの読み込みが完了したら実行されるようイベントを設定する
    window.addEventListener('DOMContentLoaded', () => {
        // special thanks! https://github.com/cocopon/tweakpane ===============
        const PANE = new Tweakpane({
            container: document.querySelector('#float-layer'),
        });
        const r = globalColor[0] * 255;
        const g = globalColor[1] * 255;
        const b = globalColor[2] * 255;
        PANE.addInput({'color': {r: r, g: g, b: b}}, 'color')
        .on('change', (v) => {
            const rgb = v.toRgbObject();
            globalColor = [
                rgb.r / 255,
                rgb.g / 255,
                rgb.b / 255,
            ];
        });
        PANE.addInput({'alpha': globalAlpha}, 'alpha', {
            step: 0.01,
            min: 0.0,
            max: 1.0,
        }).on('change', (v) => {globalAlpha = v;});
        PANE.addInput({'point-size': pointSize}, 'point-size', {
            step: 1.0,
            min: 1.0,
            max: 128.0,
        }).on('change', (v) => {pointSize = v;});
        // ====================================================================

        // キャンバスのセットアップ
        const canvas = document.getElementById('webgl-canvas');
        webgl.initialize(canvas);
        webgl.width  = window.innerWidth;
        webgl.height = window.innerHeight;
        window.addEventListener('resize', () => {
            webgl.width  = window.innerWidth;
            webgl.height = window.innerHeight;
        });

        // カメラのセットアップ
        const cameraOption = {
            distance: 5.0,
            min: 1.0,
            max: 20.0,
            move: 2.0,
        };
        camera = new WebGLOrbitCamera(canvas, cameraOption);

        // テクスチャ関係
        const img = new Image();
        img.addEventListener('load', () => {
            const gl = webgl.gl;

            texture = webgl.createTexture(img);
            // 今回はテクスチャは切り替えないので、この段階でバインドしておく
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // テクスチャパラメータを設定する
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // シェーダのロードに移行
            loadShader();
        });
        img.src = './star.png';
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
        // 頂点の情報を定義する
        points = [];
        randomValue = [];
        for(let i = 0; i < POINT_COUNT; ++i){
            const w = POINT_RANGE / 2;
            points.push(
                (Math.random() * 2.0 - 1.0) * w,
                (Math.random() * 2.0 - 1.0) * w,
                (Math.random() * 2.0 - 1.0) * w,
            );
            // 頂点１つあたり、４つの乱数値を持つようにする
            randomValue.push(
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
            );
        }
        pointVBO = [
            webgl.createVBO(points),
            webgl.createVBO(randomValue),
        ];
    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    function setupLocation(){
        const gl = webgl.gl;
        // attribute location の取得と有効化
        attLocation = [
            gl.getAttribLocation(webgl.program, 'position'),
            gl.getAttribLocation(webgl.program, 'randomValue'),
        ];
        attStride = [3, 4];
        // uniform 変数のロケーションの取得
        uniLocation = {
            mvpMatrix: gl.getUniformLocation(webgl.program, 'mvpMatrix'),
            pointSize: gl.getUniformLocation(webgl.program, 'pointSize'),
            time: gl.getUniformLocation(webgl.program, 'time'), // 時間を送ってやるようにする @@@
            textureUnit: gl.getUniformLocation(webgl.program, 'textureUnit'),
            globalColor: gl.getUniformLocation(webgl.program, 'globalColor'),
        };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    function setupRendering(){
        const gl = webgl.gl;
        gl.viewport(0, 0, webgl.width, webgl.height);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST); // 深度テストは行わない！！
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE); // 加算合成

        // ビュー x プロジェクション行列を生成
        vMatrix = camera.update();
        const fovy = 45;
        const aspect = webgl.width / webgl.height;
        const near = 0.1;
        const far = 50.0;
        pMatrix = math.mat4.perspective(fovy, aspect, near, far);
        vpMatrix = math.mat4.multiply(pMatrix, vMatrix);

        // ポイントサイズ
        gl.uniform1f(uniLocation.pointSize, pointSize);

        // テクスチャユニットの指定をシェーダに送る
        gl.uniform1i(uniLocation.textureUnit, 0);

        // グローバルカラーを uniform 変数としてシェーダに送る
        gl.uniform4fv(uniLocation.globalColor, [
            globalColor[0],
            globalColor[1],
            globalColor[2],
            globalAlpha,
        ]);
    }

    /**
     * メッシュ情報の更新と描画を行う
     * @param {number} time - 経過時間
     */
    function renderMesh(time){
        const gl = webgl.gl;

        // VBO をバインドする
        webgl.enableAttribute(pointVBO, attLocation, attStride);

        // 時間を送る @@@
        gl.uniform1f(uniLocation.time, time);

        // モデル行列を生成してシェーダに送る
        let mMatrix = math.mat4.identity(math.mat4.create());
        mMatrix = math.mat4.rotate(mMatrix, time * 0.05, [1.0, 1.0, 1.0]);
        const mvpMatrix = math.mat4.multiply(vpMatrix, mMatrix);
        gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);

        // バインド中の頂点を点として描画する
        gl.drawArrays(gl.POINTS, 0, points.length / 3);
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

