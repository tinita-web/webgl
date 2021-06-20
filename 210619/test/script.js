
// = 023 ======================================================================
// ここではまず、三角関数の最も基本的な要素であるサインとコサインについてのおさ
// らいをしましょう。
// プログラミングにおいて、一般に角度は度数ではなくラジアンで表されます。
// JavaScript の場合も、サインやコサインを求める際の角度の指定にはラジアンを用い
// る必要があります。
// ここで、時間の経過（秒数）をラジアンとみなして、その値からサインとコサインを
// 求めてやり、月の座標にそれらの結果を設定しています。サインやコサインは、角度
// が変化したときどのように振る舞うのか、ここでしっかり確かめておきましょう。
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

        // ２つの画像のロードとテクスチャの生成
        const loader = new THREE.TextureLoader();
        earthTexture = loader.load('./earth.jpg', () => {
            sunTexture = loader.load('./2097654.png', () => {
                // 月の画像がテクスチャとして生成できたら init を呼ぶ
                moonTexture = loader.load('./moon.jpg', init);
            })
        });
    }, false);

    // 汎用変数
    let run = true;    // レンダリングループフラグ
    let startTime = 0; // レンダリング開始時のタイムスタンプ @@@
    
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
    let venus;            // 地球のメッシュ
    let venusMaterial;    // 地球用マテリアル
    let mercury;            // 地球のメッシュ
    let mercuryMaterial;    // 地球用マテリアル
    let earthTexture;     // 地球用テクスチャ
    let moon;             // 月のメッシュ
    let moonMaterial;     // 月用マテリアル
    let moonTexture;      // 月用テクスチャ
    let sun;             // 太陽のメッシュ
    let sunTexture;      // 月用テクスチャ
    let sunOuter;             // 太陽のメッシュ
    let sunOuter2;             // 太陽のメッシュ
    let sunMaterial;     // 太陽用マテリアル
    let sunOuterMaterial;     // 太陽用マテリアル
    
    let moonGrp;
    let earthInnerGrp;
    let earthGrp;
    let so2Grp;
    let venusGrp;
    let mercuryGrp;

    let composer;         // コンポーザー @@@
    let renderPass;       // レンダーパス @@@
    
    
    // 月の移動量に対するスケール @@@
    const deg2rad = Math.PI / 180;
    const MOON_RANGE = 2.75;

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 500.0,
        x: 0.0,
        y: 20.0,
        z: 50.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0x000000,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xffffff,
    };
    const MATERIAL_PARAM_P = {
        color: 0xff9933,                  // 頂点の色
        opacity: 1.0,                     // 不透明度 @@@
        transparent: true,                // 透明度を有効化するかどうか @@@
        depthWrite: false                 // 深度値を書き込むかどうか @@@
    };
    // ライトに関するパラメータ
    const POINT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 2,
        length: 100.0,
        attenuation: 0.2
    };
    // アンビエントライトに関するパラメータ
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.1,
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

        // コンポーザーの設定 @@@
        // 1. コンポーザーにレンダラを渡して初期化する
        composer = new THREE.EffectComposer(renderer);
        // 2. コンポーザーに、まず最初に「レンダーパス」を設定する
        renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        // 3. コンポーザーに第２のパスとして「グリッチパス」を設定する
        // glitchPass = new THREE.GlitchPass();
        const bloomPass = new THREE.BloomPass(
            2,    // strength
            25,   // kernel size
            0.8,    // sigma ?
            512,  // blur render target resolution
        );
        composer.addPass(bloomPass);
        // 4. グリッチパスまで終わったら画面に描画結果を出すよう指示する
        var toScreen = new THREE.ShaderPass( THREE.CopyShader );
        toScreen.renderToScreen = true;
        composer.addPass( toScreen );

        // スフィアジオメトリの生成
        geometry = new THREE.SphereGeometry(1.0, 64, 64);

        // マテリアルを生成し、テクスチャを設定する
        earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        earthMaterial.map = earthTexture;
        moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        moonMaterial.map = moonTexture;
        venusMaterial = new THREE.MeshBasicMaterial({color: 0xFF4500});
        mercuryMaterial = new THREE.MeshBasicMaterial({color: 0x696969});
        sunMaterial = new THREE.MeshBasicMaterial({color: 0xFFA500});
        sunOuterMaterial = new THREE.MeshBasicMaterial(MATERIAL_PARAM_P);
        sunOuterMaterial.map = sunTexture;

        moonGrp = new THREE.Group();
        earthInnerGrp = new THREE.Group();
        earthGrp = new THREE.Group();
        so2Grp = new THREE.Group();
        venusGrp = new THREE.Group();
        mercuryGrp = new THREE.Group();

        // メッシュの生成
        earth = new THREE.Mesh(geometry, earthMaterial);
        earth.scale.setScalar(1.3);
        earthInnerGrp.add(earth);
        scene.add(earthInnerGrp);
        moon = new THREE.Mesh(geometry, moonMaterial);
        moonGrp.add(moon);
        moon.position.x = 1.9;
        moon.scale.setScalar(0.35);
        earthInnerGrp.add(moonGrp);
        earthGrp.add(earthInnerGrp);
        earthInnerGrp.position.x = 30;
        earthInnerGrp.rotation.z = -23.4 * deg2rad;
        scene.add(earthGrp);
        //mercury
        mercury = new THREE.Mesh(geometry, mercuryMaterial);
        mercury.scale.setScalar(0.45);
        mercury.position.x = 10;
        mercuryGrp.add(mercury);
        scene.add(mercuryGrp);
        //mercury
        venus = new THREE.Mesh(geometry, venusMaterial);
        venus.scale.setScalar(1.2);
        venus.position.x = 20;
        venusGrp.add(venus);
        scene.add(venusGrp);
        
        //太陽
        sun = new THREE.Mesh(geometry, sunMaterial);
        sun.scale.setScalar(5);
        scene.add(sun);
        sunOuter = new THREE.Mesh(geometry, sunOuterMaterial);
        sunOuter.scale.setScalar(5.2);
        scene.add(sunOuter);
        sunOuter2 = new THREE.Mesh(geometry, sunOuterMaterial);
        sunOuter2.scale.setScalar(5.2);
        // sunOuter2.rotation.x = 1;
        sunOuter2.rotation.z = Math.PI - 0.5;
        so2Grp.add(sunOuter2);
        scene.add(so2Grp);

        //particle start
        // 形状データを作成
        const SIZE = 100;
        // 配置する個数
        const LENGTH = 100;
        // 頂点情報を格納する配列
        const vertices = [];
        for (let i = 0; i < LENGTH; i++) {
            const x = SIZE * (Math.random() - 0.5);
            const y = SIZE * (Math.random() - 0.5);
            const z = SIZE * (Math.random() - 0.5);

            const distance =25;
            if(x < distance && y < distance){
                if(z < distance){
                    continue;
                }
            }
            
            vertices.push(x, y, z);
        }
        
        // 形状データを作成
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        // マテリアルを作成
        const material = new THREE.PointsMaterial({
            // 一つ一つのサイズ
            size: 0.3,
            // 色
            color: 0xffffff,
        });
        
        // 物体を作成
        const mesh = new THREE.Points(particleGeo, material);
        scene.add(mesh); 
        //particle end
        
        const light = new THREE.PointLight(
            POINT_LIGHT_PARAM.color,
            POINT_LIGHT_PARAM.intensity,
            POINT_LIGHT_PARAM.length,
            POINT_LIGHT_PARAM.attenuation
             );
        scene.add(light);

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
        // レンダリング開始の瞬間のタイムスタンプを変数に保持しておく @@@
        startTime = Date.now();
        render();
    }

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}
        // 特に意味はないけどとりあえず回しておくか……
        
        // 月の座標は、時間の経過からサインとコサインを使って決める @@@
        const nowTime = (Date.now() - startTime) / 1000;
        // const nowTime = (Date.now() - startTime);
        const sin = Math.sin(nowTime);
        const cos = Math.cos(nowTime);
        // 求めたサインとコサインで月の座標を指定する @@@
        // moon.position.set(cos * MOON_RANGE, 0.0, sin * MOON_RANGE);
        
        const day = nowTime * 360 * deg2rad * 0.5;
        earth.rotation.y = day % (Math.PI * 2);
        moonGrp.rotation.y = (day / 29.5) % (Math.PI * 2);
        earthGrp.rotation.y = (day / 36.5) % (Math.PI * 2);
        mercuryGrp.rotation.y = (day / 8.8 + Math.PI) % (Math.PI * 2);
        venusGrp.rotation.y = (day / 22.5 + (Math.PI * 1.5)) % (Math.PI * 2);
        sunOuter.rotation.y = (day / 3) % (Math.PI * 2);
        so2Grp.rotation.y = (day / 3 + Math.PI - 1.5) % (Math.PI * 2);

        // レンダリング
        // renderer.render(scene, camera);
        composer.render();
    }
})();

