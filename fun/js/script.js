import {OBJLoader} from '../../lib/OBJLoader.js';
import {MTLLoader} from '../../lib/MTLLoader.js';

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

        Promise.all(promises)
        .then(() => {
            setmdls();
            console.log('one');
        })
        .then(() => {
            console.log('two');
            render();
        });
        
    }, false);

    // 汎用変数
    let run = true;     // レンダリングループフラグ
    let isDown = false; // スペースキーが押されているかどうかのフラグ

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let controls;         // カメラコントロール
    let axesHelper;       // 軸ヘルパーメッシュ
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）
    const promises = [];
    const mdls = [];

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 50.0,
        x: 0.0,
        y: 10.0,
        z: 15.0,
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

    function loadmdls(objFileName, mtlFileName, arrint){
        promises.push(new Promise((resolve) => {
            const mtlLoader = new MTLLoader();
            mtlLoader.load(mtlFileName, materials => {  //mtlファイルの読み込み
                const objLoader = new OBJLoader();
                materials.preload();
                objLoader.setMaterials(materials);  //objLoaderにマテリアルをセット
                objLoader.load(objFileName, object => { //objファイルの読み込み
                    // object.scale.set(0.1,0.1,0.1);
                    scene.add(object);  //シーンに追加
                    // mdls.push(object);
                    mdls[arrint] = object;
                    resolve();
                });
            });
        }));
    }

    function init(){
        // シーン
        scene = new THREE.Scene();
        loadmdls('mdl/body.obj', 'mdl/body.mtl', 0);
        loadmdls('mdl/head.obj', 'mdl/head.mtl', 1);
        loadmdls('mdl/tumami.obj', 'mdl/tumami.mtl', 2);
        loadmdls('mdl/wing.obj', 'mdl/wing.mtl', 3);

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
        controls.target.set(0.0, 5.0, 0.0);
        controls.update();
    }

    function setmdls(){
        //wing
        mdls[3].position.y = 7.6;
        mdls[3].position.z = 1.5;
        mdls[3].rotation.x = Math.PI / 180 * 80;
        //tumami
        mdls[2].position.y = 1.2;
        mdls[2].position.z = 1.6;
        mdls[2].rotation.x = Math.PI / 180 * 15;
    }    

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // スペースキーが押されている場合グループを回転させる @@@
        if(isDown === true){
            mdls[3].rotation.y += 0.2;
        }

        // 描画
        renderer.render(scene, camera);
    }
})();

