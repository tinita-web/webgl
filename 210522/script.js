
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

    //https://lab.syncer.jp/Web/JavaScript/Snippet/66/
    function rgb2hsv ( rgb ) {
        let r = rgb[0] / 255 ;
        let g = rgb[1] / 255 ;
        let b = rgb[2] / 255 ;

        let max = Math.max( r, g, b ) ;
        let min = Math.min( r, g, b ) ;
        let diff = max - min ;

        let h = 0 ;

        switch( min ) {
            case max :
                h = 0 ;
            break ;

            case r :
                h = (60 * ((b - g) / diff)) + 180 ;
            break ;

            case g :
                h = (60 * ((r - b) / diff)) + 300 ;
            break ;

            case b :
                h = (60 * ((g - r) / diff)) + 60 ;
            break ;
        }

        let s = max == 0 ? 0 : diff / max ;
        let v = max ;

        return [ h, s, v ] ;
    }

    // https://lab.syncer.jp/Web/JavaScript/Snippet/67/
    function hsv2rgb ( hsv ) {
        let h = hsv[0] / 60 ;
        let s = hsv[1] ;
        let v = hsv[2] ;
        if ( s == 0 ) return [ v * 255, v * 255, v * 255 ] ;
    
        let rgb ;
        let i = parseInt( h ) ;
        let f = h - i ;
        let v1 = v * (1 - s) ;
        let v2 = v * (1 - s * f) ;
        let v3 = v * (1 - s * (1 - f)) ;
    
        switch( i ) {
            case 0 :
            case 6 :
                rgb = [ v, v3, v1 ] ;
            break ;
    
            case 1 :
                rgb = [ v2, v, v1 ] ;
            break ;
    
            case 2 :
                rgb = [ v1, v, v3 ] ;
            break ;
    
            case 3 :
                rgb = [ v1, v2, v ] ;
            break ;
    
            case 4 :
                rgb = [ v3, v1, v ] ;
            break ;
    
            case 5 :
                rgb = [ v, v1, v2 ] ;
            break ;
        }
    
        return rgb.map( function ( value ) {
            return value * 255 ;
        } ) ;
    }

    https://lab.syncer.jp/Web/JavaScript/Snippet/61/
    function hex2rgb ( hex ) {
        if ( hex.slice(0, 1) == "#" ) hex = hex.slice(1) ;
        if ( hex.length == 3 ) hex = hex.slice(0,1) + hex.slice(0,1) + hex.slice(1,2) + hex.slice(1,2) + hex.slice(2,3) + hex.slice(2,3) ;
    
        return [ hex.slice( 0, 2 ), hex.slice( 2, 4 ), hex.slice( 4, 6 ) ].map( function ( str ) {
            return parseInt( str, 16 ) ;
        } ) ;
    }

    https://lab.syncer.jp/Web/JavaScript/Snippet/60/
    function rgb2hex ( rgb ) {
        return "#" + rgb.map( function ( value ) {
            return ( "0" + value.toString( 16 ) ).slice( -2 ) ;
        } ).join( "" ) ;
    }

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
            let srcrgb = [lightcol.r,lightcol.g,lightcol.b];
            let srchsv = rgb2hsv(srcrgb);
            srchsv[0] += 10;
            srchsv[0] = srchsv[0] % 360;
            let dstcol = hsv2rgb(srchsv);
            directionalLight.color.r = dstcol[0]; 
            directionalLight.color.g = dstcol[1]; 
            directionalLight.color.b = dstcol[2]; 
            ambientLight.color.r = dstcol[0];
            ambientLight.color.g = dstcol[1];
            ambientLight.color.b = dstcol[2];

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

