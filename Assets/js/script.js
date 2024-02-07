const API = 'scIi6SIBBGGmzyXYkDfGzG4bOm5tJ9sL'
const APIweather = "9ec750d6e4b0dbc2bd30476d48802f5c";
const form = $("#form");
const infoBoard = $('#info');
const modalE = $("#errorModal");
const lengthVal = $("#lengthValue");
const timeVal = $("#timeValue");
const weatherDiv = $("#weatherInfo");
const weatherTemplate = $("#wTemplate");
var routeMap = tt.map({
    key: API,
    container: 'map'
});


form.on('submit', function (event) {
    event.preventDefault();
    var inputs = $(this).serializeArray();
    fetchLocations(inputs[0].value,inputs[1].value);

});
//
function fetchLocations(originName,destName){
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

        //lengthVal.text = geojson.features[0]



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
    then( (weatherData)=> {
        weatherDiv.empty(); //Clear all children in weather
        for (let i = 0; i < 5; i++) {
            let day = weatherData.list[39-(8*i)];
            let dayCard = weatherTemplate.clone(); //Clone card as a template
            dayCard.removeClass("d-none");
            dayCard.find(".weather-box").children().eq(0).text(`Day ${i+1}`);
            dayCard.find(".weather-box").children().eq(1).text("Temp: " + (Math.round(day["main"]["temp"]-273.15)*100)/100 + "°C");
            dayCard.find(".weather-box").children().eq(2).attr("src",`https://openweathermap.org/img/wn/${currentDay.weather[0].icon}@4x.png`);
            
            weatherDiv.prepend(dayCard);

        }
    })
}