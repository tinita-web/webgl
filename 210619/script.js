
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
            // 月の画像がテクスチャとして生成できたら init を呼ぶ
            moonTexture = loader.load('./moon.jpg', init);
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

    let sun;            // 地球のメッシュ
    let sunMaterial;    // 地球用マテリアル
    let earth;            // 地球のメッシュ
    let earthGrp;            // 地球のメッシュ
    let earthMaterial;    // 地球用マテリアル
    let earthTexture;     // 地球用テクスチャ
    let moon;             // 月のメッシュ
    let moonMaterial;     // 月用マテリアル
    let moonTexture;      // 月用テクスチャ

    let toMoonGeometry;    // ロケットのジオメトリ（コーン） @@@
    let toMoon;            // ロケットのメッシュ
    let toMoonGrp;            // ロケットのメッシュ
    let toMoonGrpVec;            // ロケットのメッシュ
    let toMoonMaterial;    // ロケット用マテリアル

    let toSunGeometry;    // ロケットのジオメトリ（コーン） @@@
    let toSun;            // ロケットのメッシュ
    let toSunGrp;            // ロケットのメッシュ
    let toSunMaterial;    // ロケット用マテリアル

    // 月の移動量に対するスケール @@@
    const MOON_RANGE = 2.75;
    const EARTH_RANGE = 10;

    const deg2rad = Math.PI / 180;

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 1000.0,
        x: 0.0,
        y: 10.0,
        z: 20.0,
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

        // マテリアルを生成し、テクスチャを設定する
        earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        earthMaterial.map = earthTexture;
        moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        moonMaterial.map = moonTexture;
        sunMaterial = new THREE.MeshBasicMaterial({color: 0xFFA500});

        earthGrp = new THREE.Group();
        toMoonGrp = new THREE.Group();
        toSunGrp = new THREE.Group();

        // メッシュの生成
        sun = new THREE.Mesh(geometry, sunMaterial);
        sun.scale.setScalar(2);
        scene.add(sun);
        earth = new THREE.Mesh(geometry, earthMaterial);
        earthGrp.add(earth);

        moon = new THREE.Mesh(geometry, moonMaterial);
        // 月は、サイズを小さくしておく
        moon.scale.setScalar(0.36);
        earthGrp.add(moon);

        toMoonGeometry = new THREE.ConeGeometry(0.5, 0.8, 32);
        toMoonMaterial = new THREE.MeshBasicMaterial(MATERIAL_PARAM);
        toMoon = new THREE.Mesh(toMoonGeometry, toMoonMaterial);
        toMoon.position.set(0.0, 1.0, 0.0);
        toMoonGrp.add(toMoon);
        earthGrp.add(toMoonGrp);
        toMoonGrpVec = new THREE.Vector3(0.0, 1.0, 0.0);

        toSunGeometry = new THREE.ConeGeometry(0.5, 0.8, 32);
        toSunMaterial = new THREE.MeshBasicMaterial(MATERIAL_PARAM);
        toSun = new THREE.Mesh(toSunGeometry, toSunMaterial);
        toSun.position.set(0.0, 1.0, 0.0);
        toSunGrp.add(toSun);
        // toSunGrp.add(sun);
        earthGrp.attach(toSunGrp);
        
        earthGrp.position.x = 10;
        earthGrp.rotation.z = -23.4 * deg2rad;
        scene.attach(earthGrp);



        // ディレクショナルライト
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
        earth.rotation.y += 0.02;

        // 月の座標は、時間の経過からサインとコサインを使って決める @@@
        const nowTime = (Date.now() - startTime) / 1000;
        const moonRot = [Math.sin(nowTime), Math.cos(nowTime)];
        const earthRot = [Math.sin(nowTime * 0.5), Math.cos(nowTime * 0.5)];
        // 求めたサインとコサインで月の座標を指定する @@@
        moon.position.set(moonRot[0] * MOON_RANGE, 0.0, moonRot[1] * MOON_RANGE);
        earthGrp.position.set(earthRot[0] * EARTH_RANGE, 0.0, earthRot[1] * EARTH_RANGE);
        // toMoonGrp.position.set(earthRot[0] * EARTH_RANGE, 0.0, earthRot[1] * EARTH_RANGE);

        const sunLp = earthGrp.worldToLocal(new THREE.Vector3(0, 0, 0)).normalize();
        const toSunLp = toSun.position.clone().normalize();
        const moonWP = moon.position.clone().normalize();

        // sun.position.set(sunLp.x, sunLp.y, sunLp.z);

        const tangent = new THREE.Vector3().crossVectors(toMoonGrpVec, moonWP).normalize();
        // (D) 変換前と変換後のふたつのベクトルから内積でコサインを取り出す @@@
        const cos = toMoonGrpVec.dot(moonWP);
        // (D) コサインをラジアンに戻す @@@
        const radians = Math.acos(cos);
        // 求めた接線ベクトルとラジアンからクォータニオンを定義 @@@
        const qtn = new THREE.Quaternion();
        qtn.setFromAxisAngle(new THREE.Vector3(tangent.x, tangent.y, tangent.z), radians);
        toMoonGrp.rotation.setFromQuaternion(qtn);

        const tangent2 = new THREE.Vector3().crossVectors(toMoonGrpVec, sunLp).normalize();
        const cos2 = toMoonGrpVec.dot(sunLp);
        const radians2 = Math.acos(cos2);
        const qtn2 = new THREE.Quaternion();
        qtn2.setFromAxisAngle(new THREE.Vector3(tangent2.x, tangent2.y, tangent2.z), radians2);
        toSunGrp.rotation.setFromQuaternion(qtn2);

        // レンダリング
        renderer.render(scene, camera);
    }
})();