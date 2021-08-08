import {OBJLoader} from '../../lib/OBJLoader.js';
import {MTLLoader} from '../../lib/MTLLoader.js';

(() => {
    window.addEventListener('DOMContentLoaded', () => {
        // 初期化処理
        
        init();
        
        window.addEventListener('click', (event) => {
            clicked(event);
        }, false);

        window.addEventListener('touchstart', (event) => {
            clicked(event.touches[0]);
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
        })
        .then(() => {
            render();
        });
        
    }, false);

    // 汎用変数
    let run = true;     // レンダリングループフラグ
    let isDown = false; // スペースキーが押されているかどうかのフラグ
    let rot = 0.0;
    let count = 0;
    let headrad = 0.0;
    const raycaster = new THREE.Raycaster();

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let mat;
    let textGeo;
    let textMesh;
    let trisGeo;
    let tris;
    let headGroup;
    let controls;         // カメラコントロール
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
        x: -7.0,
        y: 10.0,
        z: 20.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0x29C6D1,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xDD9496,
    };
    // textパラメータ
    const TEXT_PARAM = {
        txt: 'click here!',
        size: 20,
        height: 1,
        curveSegments: 1
    };
    // ライトに関するパラメータの定義
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 2.0,
        y: 1.0,
        z: 1.0
    };
    // アンビエントライトに関するパラメータの定義
    const AMBIENT_LIGHT_PARAM = {
        color: 0xDD9496,
        intensity: 0.8,
    };

    //モデルの読み込み
    function loadmdls(objFileName, mtlFileName, arrint){
        promises.push(new Promise((resolve) => {
            const mtlLoader = new MTLLoader();
            mtlLoader.load(mtlFileName, materials => {  //mtlファイルの読み込み
                const objLoader = new OBJLoader();
                materials.preload();
                objLoader.setMaterials(materials);  //objLoaderにマテリアルをセット
                objLoader.load(objFileName, object => { //objファイルの読み込み
                    if(arrint === 1 || arrint === 3){
                        headGroup.add(object);
                    }else{
                        scene.add(object);  //シーンに追加
                    }
                    mdls[arrint] = object;
                    resolve();
                });
            });
        }));
    }

    function init(){
        // シーン
        scene = new THREE.Scene();
        headGroup = new THREE.Group();
        loadmdls('mdl/body.obj', 'mdl/body.mtl', 0);
        loadmdls('mdl/head.obj', 'mdl/head.mtl', 1);
        loadmdls('mdl/tumami.obj', 'mdl/tumami.mtl', 2);
        loadmdls('mdl/wing.obj', 'mdl/wing.mtl', 3);

        //マテリアル
        const colors = new Uint8Array( 3 );

        for ( let c = 0; c <= colors.length; c ++ ) {
            colors[ c ] = ( c / colors.length ) * 256;
        }
        
        const gradientMap = new THREE.DataTexture( colors, colors.length, 1, THREE.LuminanceFormat );
        gradientMap.minFilter = THREE.NearestFilter;
        gradientMap.magFilter = THREE.NearestFilter;
        gradientMap.generateMipmaps = false;
        
        mat = new THREE.MeshToonMaterial( {
            color: MATERIAL_PARAM.color,
            gradientMap: gradientMap
        } );

        //文字
        const loader = new THREE.FontLoader();
        loader.load( 'font/helvetiker_bold.typeface.json', function ( font ) {
            textGeo = new THREE.TextGeometry( TEXT_PARAM.txt, {
                font: font,
                size: TEXT_PARAM.size,
                height: TEXT_PARAM.height,
                curveSegments: TEXT_PARAM.curveSegments
            } );
            textMesh = new THREE.Mesh( textGeo, mat );
            textMesh.scale.set(0.05,0.05,0.05);
            textMesh.position.set(-3.5, 0.0, 6.0);
            textMesh.rotation.x = Math.PI / 180 * -90;
            scene.add( textMesh );
        } );

        //三角形
        trisGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array( [
            0.5, 0.0, 0.0,
            0.0, 0.0, 1.0,
            -0.5, 0.0, 0.0,
        ] );
        const normals = new Float32Array( [
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
        ] );

        trisGeo.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        trisGeo.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        tris =  new THREE.Mesh(trisGeo,mat);
        tris.position.set(0.0, 0.0, 4.3);
        tris.rotation.x = Math.PI / 180 * 180;

        scene.add(tris);

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

        // コントロール
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0.0, 5.0, 0.0);
        controls.update();
    }

    function clicked(event){
        const x = event.clientX / window.innerWidth * 2.0 - 1.0;
        const y = event.clientY / window.innerHeight * 2.0 - 1.0;
        const v = new THREE.Vector2(x, -y);

        raycaster.setFromCamera(v, camera);
        const intersect = raycaster.intersectObject(mdls[2].children[0]);

        if(intersect.length > 0){
            rot += Math.PI / 180 * 240;
            rot = rot % (Math.PI * 2);
            count++;
        }
    }

    function setmdls(){
        scene.add(headGroup);
        for(let i = 0; i < 4; i++){
            mdls[i].children[0].material = mat;
        }
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

        mdls[2].rotation.y = rot;
        
        const mode = count % 3;
        if(mode === 1){
            mdls[3].rotation.y += 0.5;
        }else if(mode === 2){
            mdls[3].rotation.y += 0.5;
            headrad += Math.PI / 180 * 0.4;
            headGroup.rotation.y = Math.sin(headrad);
        }

        // 描画
        renderer.render(scene, camera);
    }
})();

