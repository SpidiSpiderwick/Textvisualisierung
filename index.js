/**
 * example function
 */

var mymap;
var svg;
var g;
var bounds;
var padding = 200;
var pointPositions = [];
var circles;
var scaleSVG = true;
var radius = 8;
var opacity = 0.5;

function onLoadPage(){
    initMap();
}

/**
 * Initialize Map with svg Layer for d3 visualisation
 */

function initMap() {
    mymap = L.map('mapid').setView([46.54, 2.44], 6);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3BpZGVyd2ljayIsImEiOiJja3BndGhsem8ya2l3Mm5ubG9qdmg1Y2I0In0.VLvrurO3hpyg39BlqImU8w', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);

    mymap.on('viewreset', updateView);
    mymap.on('zoom', updateView);

    //this svg holds the d3 visualizations
    svg = d3.select(mymap.getPanes().overlayPane).append("svg");
    g = svg.append("g").attr("class", "leaflet-zoom-hide");


}

/**
 * Loads Data when file is selected
 * @param file
 */
function loadFile(file){
    let reader = new FileReader();
    reader.readAsBinaryString(file); //liest die Datei als String ein
    reader.onloadend = function(event){ //gibt an was passiert, wenn die Datei fertig geladen wurde
        data = JSON.parse(reader.result);

        data.forEach(createLatLng);

        circles = g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("r", radius)
            .style("fill", "red")
            .attr("opacity", opacity)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", chart);

        updateView();
    }
}

function handleMouseOver(d, i) {  // Add interactivity

    // Use D3 to select element, change color and size
    console.log(d3.select(this));
    d3.select(this).style("fill", "orange");
    d3.select(this).attr("r", 50);
}

function handleMouseOut(d, i) {
    // Use D3 to select element, change color back to normal
    d3.select(this).style("fill", "red");
    d3.select(this).attr("r",function(d) { return radius/1400*Math.pow(2,mymap.getZoom())});

}

function createLatLng(d)
{
    d.LatLng = new L.LatLng(d.lat, d.long);
    d.data = [10,12,16,20,25,30,30,29,13,10,7,6];
}

function updatePosition(d)
{
    var newpoint = mymap.latLngToLayerPoint(d.LatLng);
    pointPositions.push(newpoint);
}

function updateView()
{
    //clear old positions
    pointPositions = [];
    data.forEach(updatePosition);

    circles.attr("cx",function(d) { return mymap.latLngToLayerPoint(d.LatLng).x});
    circles.attr("cy",function(d) { return mymap.latLngToLayerPoint(d.LatLng).y});
    if(scaleSVG) circles.attr("r",function(d) { return radius/1400*Math.pow(2,mymap.getZoom())});

    bounds = calculateDataBounds(pointPositions);

    var topLeft = bounds[0];
    var bottomRight = bounds[1];

    svg .attr("width", bottomRight.x - topLeft.x + 2*padding)
        .attr("height", bottomRight.y- topLeft.y + 2*padding)
        .style("left", topLeft.x-padding + "px")
        .style("top", topLeft.y-padding + "px");

    g .attr("transform", "translate(" + (-topLeft.x+padding) + ","
        + (-topLeft.y+padding) + ")");

    calcTrianguels();


}

function calculateDataBounds(features)
{
    var minx = 0, miny = 0, maxx = 0, maxy = 0;

    //find maxima
    for(var i=0; i<features.length; i++)
    {
        if(features[i].x > maxx) maxx = features[i].x;
        if(features[i].y > maxy) maxy = features[i].y;
    }

    minx = maxx;
    miny = maxy;

    //find minima
    for(var i=0; i<features.length; i++)
    {
        if(features[i].x < minx) minx = features[i].x;
        if(features[i].y < miny) miny = features[i].y;
    }

    var topleft = {};
    topleft.x = minx;
    topleft.y = miny;

    var bottomright = {};
    bottomright.x = maxx;
    bottomright.y = maxy;

    var bounds = [];
    bounds[0] = topleft;
    bounds[1] = bottomright;

    return bounds;
}

function calcTrianguels() {
    circles.selectAll("circle").each(function (d, i){
        console.log(d);
    })
}


function chart(d) {
    var data = d.data;
    console.log(data)


    var width = 300;
    var height = 80;
    var margin = {left:20,right:15,top:40,bottom:40};
    var parse = d3.timeParse("%m");
    var format = d3.timeFormat("%b");

    var div = d3.create("div")

    var svg = div.append("svg")
        .attr("width", width+margin.left+margin.right)
        .attr("height", height+margin.top+margin.bottom);
    var g = svg.append("g")
        .attr("transform","translate("+[margin.left,margin.top]+")");

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d; }) ])
        .range([height,0]);

    var yAxis = d3.axisLeft()
        .ticks(4)
        .scale(y);
    g.append("g").call(yAxis);

    var x = d3.scaleBand()
        .domain(d3.range(12))
        .range([0,width]);

    var xAxis = d3.axisBottom()
        .scale(x)
        .tickFormat(function(d) { return format(parse(d+1)); });

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("text-anchor","end")
        .attr("transform","rotate(-90)translate(-12,-15)")

    var rects = g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("y",height)
        .attr("height",0)
        .attr("width", x.bandwidth()-2 )
        .attr("x", function(d,i) { return x(i); })
        .attr("fill","steelblue")
        .transition()
        .attr("height", function(d) { return height-y(d); })
        .attr("y", function(d) { return y(d); })
        .duration(1000);

    var title = svg.append("text")
        .style("font-size", "20px")
        .attr("x", width/2 + margin.left)
        .attr("y", 30)
        .attr("text-anchor","middle");

    return div.node();

}






