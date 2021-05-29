
// = 011 ======================================================================
// これまでのサンプルでは、メッシュは「１つのジオメトリから１つ」ずつ生成してい
// ましたが、実際の案件では、同じジオメトリを再利用しながら「複数のメッシュ」を
// 生成する場面のほうが多いでしょう。
// このとき、3D シーンに複数のオブジェクトを追加する際にやってしまいがちな間違い
// として「ジオメトリやマテリアルも複数回生成してしまう」というものがあります。
// メモリ効率よく複数のオブジェクトをシーンに追加する方法をしっかりおさえておき
// ましょう。
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

        // リサイズイベントの定義
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
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
    let cubeArray = [];       // トーラスメッシュの配列 @@@
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        x: 0.0,
        y: 0.0,
        z: 10.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0x111111,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xF2F2F2,
        // specular: 0xffffff,
    };
    // ライトに関するパラメータの定義
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xFF1111,
        intensity: 1.0,
        x: 1.5,
        y: 1.0,
        z: 1.0
    };
    // アンビエントライトに関するパラメータの定義
    const AMBIENT_LIGHT_PARAM = {
        color: 0xFF1111,
        intensity: 0.6,
    };

    let posx;
    let posy;
    function calcpos(){
        posx = Math.floor(Math.random() * 20 - 10.0);
        posy = Math.floor(Math.random() * 20 - 10.0);
        if(posx > -3 && posx < 3){
            if(posy > -3 && posy < 3){
                calcpos();
            }
        }
        return;
    }

    function createCube(mode){
        calcpos();
        // ジオメトリとマテリアルは使い回せる
        const cube = new THREE.Mesh(geometry, material);
        // 位置をランダムに
        const pm = [-1,1];
        let randx = Math.round(Math.random());
        let randy = Math.round(Math.random());
        cube.position.x = posx;
        cube.position.y = posy;
        if(mode === true){
            cube.position.z = Math.floor(Math.random() * -30);
        }else{
            cube.position.z = -30;
        }
        // サイズをランダムに
        // const scale = Math.random() * 0.5 + 0.5;
        const scale = 0.9;
        cube.scale.set(scale, scale, scale);
        // または以下のように書いてもよい
        // cube.scale.setScalar(scale);
        // cube.scale.multiplyScalar(scale);
        cubeArray.push(cube);
        scene.add(cube);
    }

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

        // マテリアル
        material = new THREE.MeshLambertMaterial(MATERIAL_PARAM);

        // BOXジオメトリの生成
        geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        // トーラスのメッシュをまとめて生成し、ランダムに配置する @@@
        // cubeArray = [];
        const count = 100;
        for(let i = 0; i < count; ++i){
            createCube(true);
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
        // axesHelper = new THREE.AxesHelper(5.0);
        // scene.add(axesHelper);

        // // コントロール
        // controls = new THREE.OrbitControls(camera, renderer.domElement);
    }

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // コントロールの更新
        // controls.update();

        // スペースキーが押されている場合メッシュを回転させる @@@
        if(isDown === true){
            createCube(false);

            let lightcol = directionalLight.color;
            let hsl = { h: 0, s: 0, l: 0 };
            lightcol.getHSL(hsl);
            let v = hsl.l + hsl.s / 2;
            lightcol.setHSL(hsl.h + 0.01,hsl.s, hsl.l);
            directionalLight.color = lightcol;
            ambientLight.color = lightcol;

            cubeArray.forEach((cube) => {
                if(cube.position.z > 5.0){
                    scene.remove(cube);
                    return;
                }
                // testcall();
                cube.position.z += 0.6;
            });
        }

        // 描画
        renderer.render(scene, camera);
    }
})();

