(function () {
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
})();