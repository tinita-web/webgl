
// = 022 ======================================================================
// 数学に関する知見を深めていくにあたり、やはり題材が無いとそれも難しいので、こ
// こでは「地球」と「月」のオブジェクトを three.js で描画してみます。
// このサンプルをベースとして、いくつかの数学の基本を学んでいきましょう。
// ============================================================================

(() => {
    window.addEventListener('DOMContentLoaded', () => {
        // キーダウンイベント
        window.addEventListener('keydown', (event) => {
            switch(event.key){
                case 'Escape':
                    run = event.key !== 'Escape';
                    break;
                default:
            }
        }, false);
        // リサイズイベント
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        // ２つの画像のロードとテクスチャの生成 @@@
        const loader = new THREE.TextureLoader();
        earthTexture = loader.load('./earth.jpg', () => {
            // 月の画像がテクスチャとして生成できたら init を呼ぶ
            moonTexture = loader.load('./moon.jpg', init);
        });
    }, false);

    // 汎用変数
    let run = true;    // レンダリングループフラグ

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let geometry;         // ジオメトリ
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）

    let earth;            // 地球のメッシュ
    let earthMaterial;    // 地球用マテリアル
    let earthTexture;     // 地球用テクスチャ
    let moon;             // 月のメッシュ
    let moonMaterial;     // 月用マテリアル
    let moonTexture;      // 月用テクスチャ

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        x: 0.0,
        y: 5.0,
        z: 10.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0xffffff,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xffffff,
    };
    // ライトに関するパラメータ
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    // アンビエントライトに関するパラメータ
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

        // カメラ
        camera = new THREE.PerspectiveCamera(
            CAMERA_PARAM.fovy,
            CAMERA_PARAM.aspect,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
        camera.lookAt(CAMERA_PARAM.lookAt);

        // スフィアジオメトリの生成
        geometry = new THREE.SphereGeometry(1.0, 64, 64);

        // マテリアルを生成し、テクスチャを設定する @@@
        earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        earthMaterial.map = earthTexture;
        moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        moonMaterial.map = moonTexture;

        // メッシュの生成（ジオメトリは使いまわし） @@@
        earth = new THREE.Mesh(geometry, earthMaterial);
        scene.add(earth);
        moon = new THREE.Mesh(geometry, moonMaterial);
        scene.add(moon);

        // 月は、サイズを小さくし、初期位置を移動させておく @@@
        moon.scale.setScalar(0.36);
        moon.position.set(2.75, 0.0, 0.0);

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

        run = true;
        render();
    }

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // 特に意味はないけどとりあえず回しておくか……
        earth.rotation.y += 0.02;
        moon.rotation.y += 0.02;

        // レンダリング
        renderer.render(scene, camera);
    }
})();

