
var routeMap = tt.map({
    key: 'scIi6SIBBGGmzyXYkDfGzG4bOm5tJ9sL',
    container: 'map'
});

function createMarkerElement(type) {
    var element = document.createElement('div');
    var innerElement = document.createElement('div');
    element.className = 'route-marker';
    innerElement.className = 'icon tt-icon -white -' + type;
    element.appendChild(innerElement);
    return element;
}
function addPoint(feature) {
    var startPoint, endPoint;
    if (feature.geometry.type === 'MultiLineString') {
        startPoint = feature.geometry.coordinates[0][0]; //get first point from first line
        endPoint = feature.geometry.coordinates.slice(-1)[0].slice(-1)[0]; //get last point from last line
    } else {
        startPoint = feature.geometry.coordinates[0];
        endPoint = feature.geometry.coordinates.slice(-1)[0];
    }
    new tt.Marker({ element: createMarkerElement('start') }).setLngLat(startPoint).addTo(map);
    new tt.Marker({ element: createMarkerElement('finish') }).setLngLat(endPoint).addTo(map);
}

routeMap.once('load', function () {
    tt.services.calculateRoute({
        key: 'scIi6SIBBGGmzyXYkDfGzG4bOm5tJ9sL',
        traffic: false,
        locations: '14.8786,52.3679:4.8798,52.3679'
    }).then(function (response) {
        var geojson = response.toGeoJson();
        routeMap.addLayer({
            'id': 'route',
            'type': 'line',
            'source': { 'type': 'geojson', 'data': geojson },
            'paint': { 'line-color': '#4a90e2', 'line-width': 8 }
        }, "3D - Building");
        console.log(geojson)
        addPoint(geojson.features[0]);
        var bounds = new tt.LngLatBounds();
        geojson.features[0].geometry.coordinates.forEach(function (point) {
            bounds.extend(tt.LngLat.convert(point));
        });
        routeMap.fitBounds(bounds, { duration: 0, padding: 50 });
    });
});