// python simpleserver
// python -m SimpleHTTPServer 8888 &
// http://localhost:8888/

// HAYWARD parking lot

// demo 1
// @42.36465,-71.102468,3a,75y,267.5h,88.59t/data=!3m4!1e1!3m2!1sMonhRAl9yN44HedMpK81aQ!2e0?hl=en
var OBJECT_POSITION = [ bounding_box['left_front'][0], bounding_box['left_front'][1]],
VIEWER_POSITION = [42.36465, -71.102468],
PANO_HEAD = 267.5,
PANO_PITCH = 3,
BUILDING_3D = 'model/metro.dae',
SCENE_POSITION = [ 0, 0, 0],
SCENE_ROTATION = [-Math.PI/2, 0, 0.5],
LIGHT_POSITION = [ 400, 400, -200],
SCALE = [0.04, 0.045, 0.075],
OPACITY = 0.75,
SHOW_3D = true;




// using collada from  Sketchup
function loadBuildings(show_buildings){
    var loader = new THREE.ColladaLoader();
    loader.load(BUILDING_3D, load_building_custom(show_buildings));
}

function load_building_custom(show_buildings){

    // load building
    return function loadBuilding(geometry) {

        // rotate
        geometry.scene.rotation.x = SCENE_ROTATION[0];
        geometry.scene.rotation.z = SCENE_ROTATION[2];

        // move downwards (and back)
        geometry.scene.position.x = geometry.scene.position.x + SCENE_POSITION[0];
        geometry.scene.position.y = geometry.scene.position.y + SCENE_POSITION[1];
        geometry.scene.position.z = geometry.scene.position.z + SCENE_POSITION[2];

        // scale
        geometry.scene.scale.x = SCALE[0];
        geometry.scene.scale.y = SCALE[1];
        geometry.scene.scale.z = SCALE[2];

        var mesh = geometry.scene;

        streetViewOverlay = StreetViewOverlay();
        streetViewOverlay.load({streetView: true, objects3D: show_buildings, webGL:true}, mesh, VIEWER_POSITION[0], VIEWER_POSITION[1]);

    }

}

