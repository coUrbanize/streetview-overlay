// Translates degrees to meters. It is just a hack, not a proper projection.
// originLat and originLon should be the "center" of our area of interest or
// close to it
function hackMapProjection(lat, lon, originLat, originLon) {
    var lonCorrection = 1;
    var rMajor = 6378137.0;

    function lonToX(lon) {
        return rMajor * (lon * Math.PI / 180);
    }

    function latToY(lat) {
        if (lat === 0) {
            return 0;
        } else {
            return rMajor * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
        }
    }

    var x = lonToX(lon - originLon) / lonCorrection;
    var y = latToY(lat - originLat);

    return {'x': x, 'y': y};
}

// Origin is the position of our 3d object
function latLon2ThreeMeters(lat, lon) {
    var coordinates = hackMapProjection(lat, lon, OBJECT_POSITION[0], OBJECT_POSITION[1]);
    // -7915118.7, 5215761.9
    // -71.102721,42.364666
    console.log(coordinates.x, -coordinates.y)
    return {'x': coordinates.x, 'y': 0, 'z': -coordinates.y};
}

/*********************************************
// Using building location and  user location, calculate the following parameters
//
// Streetview
//
// calculate:
//     distance
//     heading
//     tilt
//     zoom?
//
// ThreeJS
//     building location and rotation in local coordinates (m)
//
/*********************************************


/**
 * Converts a lat,lon array into a point dictionary
 * @param {point} a point with the following structure [lon, lat] in WGS84
 * @return {Dictionary} {x: , y: } dictionary with the point reproject into meters using the Mass state plain projection
 */
function latLonToMeters(point){
    //
    var mass_state_plain = 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]';
    var wgs_84 = "+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

    // proj4(fromProj, toProj, [coords])
    projectedCoordinates = proj4(wgs_84, mass_state_plain,[point[0], point[1]]);

    // returned projected coordinates
    return {'x': projectedCoordinates[0], 'y': projectedCoordinates[1]};
}

/**
 * Calculates the distance from the user location to the building
 * @param {objectPosition} a point representing the building in [lon, lat] in WGS84
 * @param {viewerPosition} a point representing the viewer in [lon, lat] in WGS84
 * @return {Dictionary} {x: , y: } dictionary with the point reproject into meters using the Mass state plain projection
 */
function calculateDistance(objectPosition, viewerPosition){
    var obj = latLonToMeters(objectPosition);
    var viewer = latLonToMeters(viewerPosition);

    return {'x_delta': obj.x - viewer.x, 'y_delta': obj.y - viewer.y }

}

/**
 * Calculates the angle that streetview should be pointing at
 * @param {objectPosition} a point representing the building in [lon, lat] in WGS84
 * @param {viewerPosition} a point representing the viewer in [lon, lat] in WGS84
 * @return {Dictionary} Returns the measurement from North direction in degrees, measured in a clockwise direction
 */
function calculateHeading(objectPosition, viewerPosition){
    var obj = latLonToMeters(OBJECT_POSITION);
    var viewer = latLonToMeters(VIEWER_POSITION);

    return {'x_delta': obj.x - viewer.x, 'y_delta': obj.y - viewer.y }

}