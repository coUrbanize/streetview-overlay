function StreetViewOverlay() {
    var SVO = {};

    function streetViewPOVChangeListener() {
        SVO.camera.rotation.x = SVO.streetViewPano.getPov().pitch * SVO.DEG2RAD;
        SVO.camera.rotation.y = - SVO.streetViewPano.getPov().heading * SVO.DEG2RAD;
    }

    // Fixed set of panoramas to choose
    // dq: these are not used (StreetView just loads releveant panoramas for this area)
    var panoramaPos = [[41.684196,-0.888992],[41.685296,-0.888992],
                       [41.684196,-0.887992],[41.684196,-0.889992]];
    var currShownPano = 0;

    SVO.PANO_HEIGHT = 4; // For instance...

    SVO.DEFAULT_FOCAL_LENGTH = 70; // Will be using the default 35 mm for frame size
    SVO.STREETVIEW_FOCAL_LENGTH_MULTIPLIER = 12; // Discovered experimentally. Imprecise but
    // a reasonable approximation I think
    // 12 gives a horizontal FOV of 1.57 rads (aprox 90 degrees). With that value,
    // vertically the objects do not fit very well.. ??
    // Besides this, the 3d objects positioning is sligthly different in Firefox and Chromium
    // (now more precise in Firefox...) ??
    SVO.STREETVIEW_ZOOM_CONSTANT = 50; // Discovered experimentally. Imprecise.
    SVO.STREETVIEW_DIV_ID = 'streetviewpano';
    SVO.THREEJS_DIV_ID = 'container';
    SVO.DEG2RAD = Math.PI / 180;
    SVO.RAD2DEG = 180 / Math.PI;

    SVO.objects3Dmaterial = null;

    SVO.currentPanorama = null;
    SVO.scene = new THREE.Scene();

    SVO.cameraParams = {focalLength: SVO.DEFAULT_FOCAL_LENGTH};
    SVO.camera = new THREE.PerspectiveCamera(
            1, 16/9, 1, 1100 ); // When I initalize the camera, I will change fov and aspect

    // A spot light
    SVO.light = new THREE.SpotLight(0xffffbb);

    // dq  - this is very important, as it affects whether the buidling face is visible or not
    SVO.light.position.set( LIGHT_POSITION[0], LIGHT_POSITION[1], LIGHT_POSITION[2] ); // The position is chosen to be roughly
    // "compatible" with the sun in the panoramas we use
    // SVO.light.castShadow = true; // only spotligths cast shadows in ThreeJS (I think...)

    SVO.renderer = null;

    SVO.$container = null;
    SVO.container = null;

    SVO.dragView = {draggingView: false, mouseDownX: 0, mouseDownY: 0};

    SVO.$streetViewPano = null;
    SVO.streetViewPano = null;

    SVO.currentStreetViewZoom = 1;

    SVO.showing = {streetView: true, objects3D: false};

    SVO.mesh = null;

    SVO.load = function(showing, mesh, lat, lon) {
        $(document).ready(function(){
            if(mesh){
                SVO.showing= $.extend(SVO.showing, showing);
                mesh.children[0].material.opacity = OPACITY;
                SVO.mesh = mesh;
            }

            if (SVO.showing.webGL) {
                if (Detector.webgl) {
                    SVO.renderer = new THREE.WebGLRenderer();
                } else {
                    SVO.renderer = new THREE.CanvasRenderer();
                    $("#help").append('<p>WebGL not supported. A slower and less pretty version is shown.</p>');
                    $("#help").append('<p><a target="_blank" href="http://www.khronos.org/webgl/wiki_1_15/index.php/Getting_a_WebGL_Implementation">Click here to find out how to activate WebGL support</a></p>');
                }
            } else {
                SVO.renderer = new THREE.CanvasRenderer();
                $("#help").append('<p>WebGL not even tried. A slower and less pretty version is shown.</p>');
                $("#help").append('<p><a target="_blank" href="http://www.khronos.org/webgl/wiki_1_15/index.php/Getting_a_WebGL_Implementation">Click here to find out how to activate WebGL support</a></p>');
            }
            SVO.renderer.setClearColor(0x000000, 0); // TRANSPARENT BACKGROUND
            SVO.renderer.shadowMapEnabled = true; // For shadows to be shown

            SVO.$container = $('#' + SVO.THREEJS_DIV_ID);
            SVO.container = SVO.$container.get(0);
            SVO.container.appendChild(SVO.renderer.domElement);

            SVO.$streetViewPano = $('#'+SVO.STREETVIEW_DIV_ID);
            SVO.streetViewPano = new google.maps.StreetViewPanorama($('#'+SVO.STREETVIEW_DIV_ID).get(0),
                             {disableDefaultUI: true, scrollwheel: false, clickToGo: false, linksControl: false, zoomControl: false});

            // In order to show and make responsive the links that Google adds to every
            // Street View panorama (link to Google maps, terms of use etc.) I have
            // made the threejs container smaller than the streetview panorama, so the
            // bottom of the panorama is not covered. This works, but creates a problem: if
            // the user drags the panorama from the bottom of the window, the threejs
            // container does not receive the event, so the panorama changes but the 3D model
            // does not. I have to listen to the pano_changed event of the street view
            // panorama to make up for this:
            google.maps.event.addListener(SVO.streetViewPano, 'pov_changed', streetViewPOVChangeListener);


            // show/ hide building
            if (SVO.showing.objects3D) {
                SVO.scene.add(SVO.mesh);
            }

            SVO.scene.add(SVO.light);
            SVO.attachEventHandlers();

            // Obtain real panorama position (the closest one in Street View to
            // lat,lon and call init to start
            SVO.realPanoPos(lat,lon, SVO.init);

            // add a grid
            // each square
            // var planeW = 10; // pixels
            // var planeH = 10; // pixels
            // var numW = 10; // how many wide (50*50 = 2500 pixels wide)
            // var numH = 10; // how many tall (50*50 = 2500 pixels tall)
            // var plane = new THREE.Mesh( new THREE.PlaneGeometry( planeW*50, planeH*50, planeW, planeH ), new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ) );
            // // rotation.z is rotation around the z-axis, measured in radians (rather than degrees)
            // // Math.PI = 180 degrees, Math.PI / 2 = 90 degrees, etc.
            // plane.rotation.z = Math.PI/2;
            // plane.rotation.y = Math.PI/4;
            // plane.position.x = SCENE_POSITION[0];
            // plane.position.y = -50;
            // plane.position.z = -200;
            // SVO.scene.add(plane);


            // Add Axes
            function buildAxes( length ) {
                var axes = new THREE.Object3D();

                axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
                axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
                axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
                axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
                axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
                axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

                return axes;

            }

            function buildAxis( src, dst, colorHex, dashed ) {
                var geom = new THREE.Geometry(),
                    mat; 

                if(dashed) {
                    mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
                } else {
                    mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
                }

                geom.vertices.push( src.clone() );
                geom.vertices.push( dst.clone() );
                geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

                var axis = new THREE.Line( geom, mat, THREE.LinePieces );

                return axis;

            }

            // Add axes
            axes = buildAxes( 1000 );
            axes.rotation.x = SCENE_ROTATION[0];
            axes.rotation.z = SCENE_ROTATION[2];
            SVO.scene.add( axes );


        });
    };

    SVO.init = function(lat, lon) {
        var i;

        var panoPos = latLon2ThreeMeters(lat, lon);

        SVO.currentPanorama = {};
        SVO.currentPanorama.position = new THREE.Vector3(panoPos.x, panoPos.y, panoPos.z);
        SVO.currentPanorama.position.y += SVO.PANO_HEIGHT;
        SVO.currentPanorama.heading = PANO_HEAD; // dq: make this value a parameter
        SVO.currentPanorama.pitch = PANO_PITCH;

        if (SVO.showing.streetView) {
            SVO.cameraParams.focalLength = SVO.streetViewFocalLenght();
            SVO.initStreetView(lat, lon);
        }

        SVO.camera.aspect = SVO.$container.width() / SVO.$container.height();
        SVO.camera.setLens(SVO.cameraParams.focalLength);

        SVO.camera.position = SVO.currentPanorama.position;

        // Changing rotation order is necessary. As rotation is relative to the position
        // of the camera, if it rotates first in the X axis (by default), the Y axis
        // will not be "up" anymore. If I rotate first in the Y axis, rotation in X is
        // not affected so I can rotate in X later.
        SVO.camera.rotation.order = 'YXZ';
        SVO.camera.rotation.x = SVO.currentPanorama.pitch * SVO.DEG2RAD;
        SVO.camera.rotation.y = -SVO.currentPanorama.heading * SVO.DEG2RAD;

        SVO.renderer.setSize(SVO.$container.width(), SVO.$container.height());
        SVO.animate();
    };

    SVO.initStreetView = function(lat, lon) {
        var panoPos = new google.maps.LatLng(lat,lon);
        var myPOV = {heading:SVO.currentPanorama.heading,
                     pitch:SVO.currentPanorama.pitch, zoom:1};
        SVO.streetViewPano.setPosition(panoPos);
        SVO.streetViewPano.setPov(myPOV);
    };

    SVO.updateStreetView = function() {
        // If I am calling this function, I do not need the streetViewPano
        // to generate events when pov changes
        google.maps.event.clearListeners(SVO.streetViewPano, 'pov_changed');

        var myPOV = {heading: SVO.currentHeading(),
                     pitch:SVO.currentPitch(), zoom:SVO.currentStreetViewZoom};
        SVO.streetViewPano.setPov(myPOV);

        // After updating pov, it can generate pov change events again
        google.maps.event.addListener(SVO.streetViewPano, 'pov_changed', streetViewPOVChangeListener);
    };

    SVO.realPanoPos = function(lat, lon, callBackFun) {
        var givenPanoPos = new google.maps.LatLng(lat, lon);

        function processSVData(data, status) {
           if (status === google.maps.StreetViewStatus.OK) {
               callBackFun(data.location.latLng.lat(),
                           data.location.latLng.lng());
           } else {
               throw new Error("Panorama not found");
           }
        }
        var sv = new google.maps.StreetViewService();
        // With a radius of 50 or less, this call returns information
        // about the closest streetview panorama to the given position.
        // In the callback function processSVData, the data
        // parameter can give us the TRUE position of the panorama.
        // This is necessary because the StreetViewPanorama object position
        // is the one we give to it, no the TRUE position of that panorama.
        sv.getPanoramaByLocation(givenPanoPos, 50, processSVData);
    };

    // Returns a focal length "compatible" with a Google Street View background
    // given the current size of the renderer and the given zoomLevel
    SVO.streetViewFocalLenght = function(zoomLevel) {
        if (!zoomLevel || zoomLevel < 1) {
            zoomLevel = 1;
        }
        if (SVO.$container.width() > 0) {
            return (SVO.STREETVIEW_FOCAL_LENGTH_MULTIPLIER * SVO.$container.width() / SVO.$container.height())
                   + SVO.STREETVIEW_ZOOM_CONSTANT * (zoomLevel - 1);

        } else {
            // Just in case innerHeight is 0. If that happens, it does not matter which
            // focal length we return, because nothing will be shown
            return SVO.DEFAULT_FOCAL_LENGTH;
        }
    };


    SVO.currentHeading = function() {
      return -(SVO.camera.rotation.y * SVO.RAD2DEG);
    };

    SVO.currentPitch = function() {
      return SVO.camera.rotation.x * SVO.RAD2DEG;
    };


    SVO.attachEventHandlers = function() {
        function onMouseWheel(event) {
            event.preventDefault();
            event.stopPropagation();

            // Zooming could be more "progressive", but for now this is enough
            if (event.deltaY > 0) {
                SVO.currentStreetViewZoom += 1;
                SVO.cameraParams.focalLength = SVO.streetViewFocalLenght(SVO.currentStreetViewZoom);
            } else {
                if (SVO.currentStreetViewZoom > 1) {
                    SVO.currentStreetViewZoom -= 1;
                    SVO.cameraParams.focalLength = SVO.streetViewFocalLenght(SVO.currentStreetViewZoom);
                }
            }


            SVO.camera.setLens(SVO.cameraParams.focalLength);
            SVO.camera.updateProjectionMatrix();

            SVO.updateStreetView();

            SVO.render();
        };

        function onMouseDown(event) {
            event.preventDefault();
            event.stopPropagation();

            SVO.dragView.draggingView = true;

            SVO.dragView.mouseDownX = event.clientX;
            SVO.dragView.mouseDownY = event.clientY;
        };

        function onMouseUp(event) {
            event.preventDefault();
            event.stopPropagation();
            SVO.dragView.draggingView = false;
        };

        function onMouseMove(event) {
            event.preventDefault();
            event.stopPropagation();

            var horizontalMovement, verticalMovement;

            var aspect = SVO.$container.width() / SVO.$container.height();
            // horizontal FOV. Formula from <https://github.com/mrdoob/three.js/issues/1239>
            var hFOV = 2 * Math.atan( Math.tan( (SVO.camera.fov * SVO.DEG2RAD) / 2 ) * aspect );
            //console.log("focal lenght zoom 1="+SVO.STREETVIEW_FOCAL_LENGTH_MULTIPLIER * SVO.$container.width() / SVO.$container.height());
            //console.log("SVO.camera.fov="+SVO.camera.fov);
            //console.log("hFOV="+hFOV);

            if (SVO.dragView.draggingView) {
                horizontalMovement = SVO.dragView.mouseDownX  - event.clientX;
                // dq : reverse this so it behaves like google
                verticalMovement  = event.clientY - SVO.dragView.mouseDownY;


                // The /N is to adjust the "responsiveness" of the panning.
                // This needs a rewriting but for now it works...
                SVO.camera.rotation.y = (SVO.camera.rotation.y - ((horizontalMovement/5.5) * hFOV / SVO.$container.width())) % (2 * Math.PI);
                SVO.camera.rotation.x = SVO.camera.rotation.x + ((verticalMovement/5.5) *  (SVO.camera.fov * SVO.DEG2RAD) / SVO.$container.height());
                SVO.camera.rotation.x = Math.max(-Math.PI/2, Math.min( Math.PI/2, SVO.camera.rotation.x));

                SVO.updateStreetView();
            }
        };

        function onWindowResize() {
            SVO.camera.aspect = SVO.$container.width() / SVO.$container.height();

            if (SVO.showing.streetView) {
              SVO.cameraParams.focalLength = SVO.streetViewFocalLenght();
              SVO.camera.setLens(SVO.cameraParams.focalLength);
            }
            SVO.camera.updateProjectionMatrix();

            SVO.renderer.setSize(SVO.$container.width(), SVO.$container.height());
        };

        function onKeyUp(event) {
            currShownPano = (currShownPano + 1) % panoramaPos.length;

            switch (event.which) {
                case 13: // return
                case 32: // space
                    event.preventDefault();
                    event.stopPropagation();
                    // change to the next panorama in panoramaPos
                    SVO.realPanoPos(panoramaPos[currShownPano][0],
                                    panoramaPos[currShownPano][1], SVO.init);
                default:
                    // Nothing. It is important not to interfere at all
                    // with keys I do not use.
            }
        };

        SVO.$container.mousewheel(onMouseWheel);
        SVO.$container.mousedown(onMouseDown);
        SVO.$container.mouseup(onMouseUp);
        SVO.$container.mousemove(onMouseMove);
        $(window).resize(onWindowResize);
        $(document).on("keyup", onKeyUp);

    };

    SVO.animate = function() {
        requestAnimationFrame(SVO.animate);
        SVO.render();
    };

    SVO.render = function() {
        SVO.renderer.render(SVO.scene, SVO.camera );
    };

    return SVO;
};