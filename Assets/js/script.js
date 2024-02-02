const API = 'scIi6SIBBGGmzyXYkDfGzG4bOm5tJ9sL'
const form = $("#form");
const infoBoard = $('#info');
var routeMap = tt.map({
    key: API,
    container: 'map'
});

form.on('submit', function (event) {
    event.preventDefault();
    var inputs = $(this).serializeArray();
    inputs = Object.assign({},...inputs);
    console.log(inputs);
});

function fetchLocations(originName,destName){

    //Request origin coordinates
    var originURL = `https://api.tomtom.com/search/2/geocode/${originName}.json?key=${API}&countrySet=US&limit=1`;
    var f1 = fetch(originURL).then((response)=>{return response.json()})
    .then( (originData)=>{
        return originData
    });

    //Request destination coordinates
    var destURL = `https://api.tomtom.com/search/2/geocode/${destName}.json?key=${API}&countrySet=US&limit=1`;
    var f2 = fetch(destURL).then((response)=>{return response.json()})
    .then( (destData)=>{
        return destData
    });

    //Resolve both requests and update HTML
    Promise.all([f1,f2]).then((values) => {
        console.log(values);
        var or = {
            name:values[0]["results"][0]["address"]["freeformAddress"],
            lat:values[0]["results"][0]["position"]["lat"],
            lon:values[0]["results"][0]["position"]["lon"]
        };
        var des = {
            name:values[1]["results"][0]["address"]["freeformAddress"],
            lat:values[1]["results"][0]["position"]["lat"],
            lon:values[1]["results"][0]["position"]["lon"]
        }
        console.log(or);
        render_route([or.lat,or.lon],[des.lat,des.lon]);
    });
};

fetchLocations("newyork","riga");


function render_route(originPos,destPos){
    var loc = `${originPos[1]},${originPos[0]}:${destPos[1]},${destPos[0]}`;
    console.log(loc)
    tt.services.calculateRoute({
        key: API,
        traffic: false,
        locations: loc
    }).then(function (response) {
        var geojson = response.toGeoJson();
        routeMap.addLayer({
            'id': 'route',
            'type': 'line',
            'source': { 'type': 'geojson', 'data': geojson },
            'paint': { 'line-color': '#4a90e2', 'line-width': 8 }
        }, "3D - Building");
        var viewPort = new tt.LngLatBounds();
        console.log(geojson)
        geojson.features[0].geometry.coordinates.forEach(function (point) {
            viewPort.extend(tt.LngLat.convert(point));
        });
        routeMap.fitBounds(viewPort, { duration: 0, padding: 50 });
    });
}