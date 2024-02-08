const API = 'scIi6SIBBGGmzyXYkDfGzG4bOm5tJ9sL'
const APIweather = "9ec750d6e4b0dbc2bd30476d48802f5c";
const form = $("#form");
const infoBoard = $('#info');
const modalE = $("#errorModal");
const lengthVal = $("#lengthValue");
const timeVal = $("#timeValue");
const routeName = $('#routeName');
const weatherDiv = $("#weatherInfo");
const forecastDest = $("#forecastDest");
const weatherTemplate = $("#weatherTemplate");
const searchedButtons = $("#searchedButtons");
var routeMap = tt.map({
    key: API,
    container: 'map'
});

$(document).ready(function(){
    renderPreviousSearches();
})

form.on('submit', function (event) {
    event.preventDefault();
    var inputs = $(this).serializeArray();
    fetchLocations(inputs[0].value,inputs[1].value,false);
    map.scrollIntoView();
});
//
function fetchLocations(originName,destName,fromButton){
    //Request origin coordinates
    var originURL = `https://api.tomtom.com/search/2/geocode/${originName}.json?key=${API}&countrySet=US&limit=1`;
    var f1 = fetch(originURL).then((response)=>{return response.json()})
    .then( (originData)=>{
        if(originData["summary"]["numResults"] < 1){
            throw new Error (`Place "${originData["summary"]["query"]}" is not found`);
        }
        return originData
    });

    //Request destination coordinates
    var destURL = `https://api.tomtom.com/search/2/geocode/${destName}.json?key=${API}&countrySet=US&limit=1`;
    var f2 = fetch(destURL).then((response)=>{return response.json()})
    .then( (destData)=>{
        if(destData["summary"]["numResults"] < 1){
            throw Error (`Place "${destData["summary"]["query"]}" is not found`);
        }
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
        render_route([or.lat,or.lon],[des.lat,des.lon]);
        renderWeather(des.lat,des.lon);
        if(!fromButton) addToStorage(or.name+"/"+des.name);
        routeName.text(or.name+" → "+des.name);
        forecastDest.text(des.name)
    }).catch((e)=>{
        showModal(e);
    });
};

function render_route(originPos,destPos){
    var loc = `${originPos[1]},${originPos[0]}:${destPos[1]},${destPos[0]}`;
    tt.services.calculateRoute({
        key: API,
        traffic: false,
        locations: loc
    }).then(function (response) {
        var geojson = response.toGeoJson();
        if (routeMap.getLayer('route')) {
            routeMap.removeLayer('route');
            routeMap.removeSource('route');
        }
        console.log(geojson)

        lengthVal.text(round2(geojson.features[0].properties.summary.lengthInMeters/1000) + " Km");
        timeVal.text(round2(geojson.features[0].properties.summary.travelTimeInSeconds/3600) + " Hours");

        routeMap.addLayer({
            'id': 'route',
            'type': 'line',
            'source': { 'type': 'geojson', 'data': geojson },
            'paint': { 'line-color': '#4a90e2', 'line-width': 8 }
        }, "3D - Building");
        var viewPort = new tt.LngLatBounds();
        geojson.features[0].geometry.coordinates.forEach(function (point) {
            viewPort.extend(tt.LngLat.convert(point));
        });
        routeMap.fitBounds(viewPort, { duration: 0, padding: 50 });
    });
}

function showModal(text){
    let modal = new bootstrap.Modal(modalE);
    modalE.find(".modal-body").text(text);
    modal.show();
}


function renderWeather(lat,lon){
    var weatherURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${APIweather}&cnt=60` 
    fetch(weatherURL)
    .then( (response)=> {return response.json()} )
    .then( (weatherData)=> {
        weatherDiv.empty(); //Clear all children in weather
        for (let i = 0; i < 5; i++) {
            let dayData = weatherData.list[39-(8*i)];
            let dayCard = weatherTemplate.clone(); //Clone card as a template
            dayCard.removeClass("d-none");
            dayCard.children().eq(0).text(`Day ${5-i}`);
            dayCard.children().eq(1).text("Temperature: " + (Math.round(dayData["main"]["temp"]-273.15)*100)/100 + "°C");
            dayCard.children().eq(2).attr("src",`https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png`);
            
            weatherDiv.prepend(dayCard);

        }
    })
}

function round2(num){
    return Math.round(num*100)/100
}

function renderPreviousSearches(){
    var searches = JSON.parse(localStorage.getItem("lastSearches"));
    searchedButtons.empty();
    if(searches != null){
        for (const t of searches) {
            var btn = $("<button>"); 
            btn.text(t);
            btn.on("click",function(){
                var locations = t.split("/");
                fetchLocations(locations[0],locations[1],true);
            });
            btn.addClass("btn btn-info");
            searchedButtons.append(btn);
        }
        
        
    }
}

function addToStorage(text){
    var searches = JSON.parse(localStorage.getItem("lastSearches"));
    if(searches == null) searches = [];
    searches.unshift(text);
    if(searches.length > 4) searches.pop();
    localStorage.setItem("lastSearches", JSON.stringify(searches));
    renderPreviousSearches();
}