
// = 012 ======================================================================
// 3DCG は、現実世界の奥行きのある世界を「計算を駆使して」シミュレートします。
// 当然、計算方法が変化すれば描画される結果が変わってくるわけですが……
// たとえばカメラの種類も、この計算方法に大きく影響する要因の１つです。カメラは
// これまで一貫して PerspectiveCamera を使ってきましたが、three.js にはその他に
// も OrthographicCamera という種類のカメラがあります。
// このカメラを利用する場合、プログラマが指定するパラメータもまったく違ったもの
// になりますし、描画される際の計算方法が変化することで描画結果も変化します。
// 両者の違いについて把握しておきましょう。
// ============================================================================

(() => {
    window.addEventListener('DOMContentLoaded', () => {
        // 初期化処理
        init();

        // キーダウンイベントの定義
        window.addEventListener('keydown', (event) => {
            switch(event.key){
                case 'Escape':
                    run = event.key !== 'Escape';
                    break;
                case ' ':
                    isDown = true;
                    break;
                default:
            }
        }, false);
        window.addEventListener('keyup', (event) => {
            isDown = false;
        }, false);

        // リサイズイベントの定義 @@@
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            // リサイズ時の処理も初期化時と同様の方法で設定する（※説明は初期化時の処理を参照）
            const aspect = window.innerWidth / window.innerHeight;
            const scale = 10.0;
            const horizontal = scale * aspect;
            const vertiacal = scale;
            camera.left = -horizontal;
            camera.right = horizontal;
            camera.top = vertiacal;
            camera.bottom = -vertiacal;
            camera.updateProjectionMatrix();
        }, false);

        // 描画処理
        run = true;
        render();
    }, false);

    // 汎用変数
    let run = true;     // レンダリングループフラグ
    let isDown = false; // スペースキーが押されているかどうかのフラグ

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let geometry;         // ジオメトリ
    let material;         // マテリアル
    let torusArray;       // トーラスメッシュの配列
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）

    // カメラに関するパラメータ @@@
    const aspect = window.innerWidth / window.innerHeight; // アスペクト比
    const scale = 10.0;                                     // 切り取る空間の広さ（スケール）
    const horizontal = scale * aspect;                     // 横方向のスケール
    const vertiacal = scale;                               // 縦方向のスケール
    const CAMERA_PARAM = {
        left: -horizontal,  // 切り取る空間の左端
        right: horizontal,  // 切り取る空間の右端
        top: vertiacal,     // 切り取る空間の上端
        bottom: -vertiacal, // 切り取る空間の下端
        near: 0.1,
        far: 50.0,
        x: 0.0,
        y: 5.0,
        z: 20.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0x666666,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0x3399ff,
        specular: 0xffffff,
    };
    // ライトに関するパラメータの定義
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    // アンビエントライトに関するパラメータの定義
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.2,
    };

    function init(){
        // シーン
        scene = new THREE.Scene();

        // レンダラ
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
        const wrapper = document.querySelector('#webgl');
        wrapper.appendChild(renderer.domElement);

        // カメラ @@@
        camera = new THREE.OrthographicCamera(
            CAMERA_PARAM.left,
            CAMERA_PARAM.right,
            CAMERA_PARAM.top,
            CAMERA_PARAM.bottom,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
        camera.lookAt(CAMERA_PARAM.lookAt);

        // マテリアル
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);

        // トーラスジオメトリの生成
        geometry = new THREE.TorusGeometry(1.0, 0.4, 32, 32);
        // トーラスのメッシュをまとめて生成し、ランダムに配置する
        torusArray = [];
        const count = 20;
        for(let i = 0; i < count; ++i){
            // ジオメトリとマテリアルは使い回せる
            const torus = new THREE.Mesh(geometry, material);
            // 位置をランダムに
            torus.position.x = Math.random() * 10.0 - 5.0;
            torus.position.y = Math.random() * 10.0 - 5.0;
            torus.position.z = Math.random() * 20.0 - 10.0;
            torusArray.push(torus);
            scene.add(torus);
        }

        // ディレクショナルライト
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        scene.add(directionalLight);

        // アンビエントライト
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        // 軸ヘルパー
        axesHelper = new THREE.AxesHelper(5.0);
        scene.add(axesHelper);

        // コントロール
        controls = new THREE.OrbitControls(camera, renderer.domElement);
    }

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // コントロールの更新
        controls.update();

        // スペースキーが押されている場合メッシュを回転させる
        if(isDown === true){
            torusArray.forEach((torus) => {
                torus.rotation.y += 0.02;
                torus.rotation.z += 0.02;
            });
        }

        // 描画
        renderer.render(scene, camera);
    }
})();

