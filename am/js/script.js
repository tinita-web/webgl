// import {FBXLoader} from '../../lib/FBXLoader.js';

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
    let rot = 0.0;
    let count = 0;
    let bodytime = 0.0;
    let headrad = 0.0;
    const raycaster = new THREE.Raycaster();
    const clock = new THREE.Clock();

    // three.js に関連するオブジェクト用の変数
    let scene;            // シーン
    let camera;           // カメラ
    let renderer;         // レンダラ
    let stats;
    let mat;
    let textGeo;
    let textMesh;
    let trisGeo;
    let tris;
    let controls;         // カメラコントロール
    let directionalLight; // ディレクショナル・ライト（平行光源）
    let ambientLight;     // アンビエントライト（環境光）
    const promises = [];
    const mdls = [];
    let mixer;
    const mixers = [];

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
    function loadmdls(fbxFileName, arrint){
        promises.push(new Promise((resolve) => {
            var loader = new THREE.FBXLoader();
            loader.load( fbxFileName, function ( object ) {
                object.mixer = new THREE.AnimationMixer( object );
                mixers.push( object.mixer );
                mixer = object.mixer;
                if(object.animations.length > 0){
                    var action = object.mixer.clipAction( object.animations[ 0 ] );
                    action.play();
                }
                object.scale.set(0.1,0.1,0.1);
                scene.add( object );
                resolve();
            } );
        }));
    }

    function init(){
        // シーン
        scene = new THREE.Scene();
        loadmdls('mdl/am_walk.fbx', 0);

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

        // stats = new Stats();
        // container.appendChild( stats.dom );


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
        // const intersect = raycaster.intersectObjects();

        // if(intersect.length > 0){
        //     console.log('aaa');
        // }
    }

    function setmdls(){

    }    

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // if ( mixers.length > 0 ) {
        //     for ( var i = 0; i < mixers.length; i ++ ) {
        //         mixers[ i ].update( clock.getDelta() );
        //     }
        // }
        const delta = clock.getDelta();

        if ( mixer ) mixer.update( delta );

        // 描画
        renderer.render(scene, camera);
        // stats.update();
    }
})();

