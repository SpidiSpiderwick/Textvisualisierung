/**
 * example function
 */
function test() {
    var mymap = L.map('mapid').setView([46.54, 2.44], 6);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3BpZGVyd2ljayIsImEiOiJja3BndGhsem8ya2l3Mm5ubG9qdmg1Y2I0In0.VLvrurO3hpyg39BlqImU8w', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);

    L.circle([48.8, 2.3], 500, {
        color: 'green',
        fillColor: 'green',
        fillOpacity: 0.5
    }).addTo(mymap).bindPopup("I am a circle.");

    var popup = L.popup();

    mymap.on('click', onMapClick);

    function onMapClick(e) {
        console.log(e.latlng)
        popup.setLatLng(e.latlng) //Koordinate des Popups
            .setContent("You clicked the map at " + e.latlng.toString()) //Inhalt des Popups
            .openOn(mymap); //Ziel des Popups
    }
}

function loadFile(file){
    let reader = new FileReader();
    reader.readAsBinaryString(file); //liest die Datei als String ein
    reader.onloadend = function(event){ //gibt an was passiert, wenn die Datei fertig geladen wurde
        drawPoints(event.target.result);
    }
}

/**
 * We should preprocess the Data in Python, maybe store it via API on demand on my server, so we dont need to upload it on the Website
 * @param data
 */
function drawPoints(data){
    console.log(data)
}






