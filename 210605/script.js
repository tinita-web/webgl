
// = 013 ======================================================================
// three.js を使っているかどうかにかかわらず、3D プログラミングとはそもそもかな
// り難易度の高いジャンルです。
// その中でも、特に最初のころに引っかかりやすいのが「回転や位置」の扱いです。
// ここではそれを体験する意味も含め、グループの使い方を知っておきましょう。この
// グループという概念を用いることで、three.js ではオブジェクトの制御をかなり簡単
// に行うことができるようになっています。
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
    let wingGeo;         // ジオメトリ
    let jikuGeo;         // ジオメトリ
    let bodyGeo;         // ジオメトリ
    let footGeo;         // ジオメトリ
    let material;         // マテリアル
    let wingArray;       // トーラスメッシュの配列
    let headGroup;            // グループ @@@
    let bodyGroup;            // グループ @@@
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 50.0,
        x: 0.0,
        y: 5.0,
        z: 10.0,
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

    const WING_PARAM = {
        radius: 2.0,
        segments: 6,
        // thetaStart: 0,
        // thetaLength: `Math.PI * 0.3`
    }

    const JIKU_PARAM = {
        top: 0.2,
        bottom: 0.2,
        height: 2,
        segments: 12
    }

    const BODY_PARAM = {
        top: 0.3,
        bottom: 0.3,
        height: 4,
        segments: 12
    }

    const FOOT_PARAM = {
        top: 1.5,
        bottom: 1.5,
        height: 0.25,
        segments: 24
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

        // - グループを使う ---------------------------------------------------
        // three.js のオブジェクトは、グループにひとまとめにすることができます。
        // グループを使わないと実現できない挙動、というのも一部にはありますので、
        // ここで使い方だけでもしっかり覚えておきましょう。
        // 特に、グループに追加したことによって「回転や平行移動の概念が変わる」
        // ということが非常に重要です。
        // --------------------------------------------------------------------
        // グループ @@@
        headGroup = new THREE.Group();
        bodyGroup = new THREE.Group();
        
        // マテリアル
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        material.side = THREE.DoubleSide;
        
        // トーラスジオメトリの生成
        wingGeo = new THREE.CircleGeometry(
            WING_PARAM.radius,
            WING_PARAM.segments, 
            Math.PI * -0.15,
            Math.PI * 0.3,
        );

        jikuGeo = new THREE.CylinderGeometry(
            JIKU_PARAM.top,
            JIKU_PARAM.bottom,
            JIKU_PARAM.height,
            JIKU_PARAM.segments
        );

        bodyGeo = new THREE.CylinderGeometry(
            BODY_PARAM.top,
            BODY_PARAM.bottom,
            BODY_PARAM.height,
            BODY_PARAM.segments
        );

        footGeo = new THREE.CylinderGeometry(
            FOOT_PARAM.top,
            FOOT_PARAM.bottom,
            FOOT_PARAM.height,
            FOOT_PARAM.segments
        );

        footUpperGeo = new THREE.CylinderGeometry(
            0.3,
            FOOT_PARAM.bottom,
            FOOT_PARAM.height,
            FOOT_PARAM.segments
        );
            // トーラスのメッシュをまとめて生成し、ランダムに配置する
        wingArray = [];
        const count = 3;
        for(let i = 0; i < count; ++i){
            // ジオメトリとマテリアルは使い回せる
            const wing = new THREE.Mesh(wingGeo, material);
            // 位置をランダムに
            // wing.position.x = 1.0;
            let g = new THREE.Group();
            g.add(wing);
            g.rotation.z = Math.PI * 2 / 3 * i;
            // シーンではなく、グループにトーラスを追加する @@@
            headGroup.add(g);
        }
        //軸の追加
        {
            const jiku = new THREE.Mesh(jikuGeo, material);
            jiku.rotation.x = Math.PI / 2;
            // jiku.position.z = -0.5;
            headGroup.add(jiku);
        }
        headGroup.position.z = 1;
        bodyGroup.add(headGroup);
        //ボディ軸の追加
        {
            const body = new THREE.Mesh(bodyGeo, material);
            body.position.y = -1.8;
            bodyGroup.add(body);
        }
        //土台の追加
        {
            const footUpper = new THREE.Mesh(footUpperGeo, material);
            footUpper.position.y = -3.55;
            scene.add(footUpper);
            const foot = new THREE.Mesh(footGeo, material);
            foot.position.y = -3.8;
            scene.add(foot);
        }

        // グループをシーンに追加する @@@
        scene.add(bodyGroup);

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

        // スペースキーが押されている場合グループを回転させる @@@
        if(isDown === true){
            bodyGroup.rotation.y += 0.02;
            headGroup.rotation.z += 0.02;
        }

        // 描画
        renderer.render(scene, camera);
    }
})();

