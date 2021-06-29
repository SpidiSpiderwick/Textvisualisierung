/**
 * example function
 */

let mode = 0;

var data;

var mymap;
var svg;
var g;
var bounds;
var padding = 200;
var pointPositions = [];
var circles;
var radius = 3;
var scaleSVG = true;
var opacity = 0.5;
var zoomlevel;
var D;
var z;
/**
 * array of ids of accidents which are selected by the timeline slider
 */
var selected = [];

/**
 * array, welches pro Datum ein Objekt enthält, welches die Form:
 * {
 *     "key": DATUM,
 *     "value": [NUM_ACC1, NUM_ACC2, ..]
 * }
 * hat. NUM_ACC* steht für number of accident (unique identifier)
 * @type {*[]}
 */
var tlData = [];


function onLoadPage(){
    initMap();
}

/**
 * Initialize Map with svg Layer for d3 visualisation
 */

function initMap() {
    mymap = L.map('mapid').setView([46.54, 2.44], 6);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3BpZGVyd2ljayIsImEiOiJja3BndGhsem8ya2l3Mm5ubG9qdmg1Y2I0In0.VLvrurO3hpyg39BlqImU8w', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery Â© <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);

    z = mymap.getZoom();

    mymap.on('viewreset', updateEverything);
    mymap.on('zoom', updateEverything);

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
        //so its faster for testting

        var limit = Number.MAX_SAFE_INTEGER;

        var n = 0;
        for (const index in data) {
            if (n < limit) {
                appendInformation(data[index]);
                n++;
            } else {
                delete data[index];
            }
        }

        console.log(data);

        prepTimelineData();
        showTimeline();
        console.log("timeline done?");
        preprocessD();
        updateView2();

    }
}

function prepTimelineData() {
    var tempData = {};
    for (const acc_num in data) {
        let date = data[acc_num].date;
        if (tempData.hasOwnProperty(date)) {
            tempData[date].push(acc_num);
        } else {
            tempData[date] = [acc_num];
        }
    }

    for (var key of Object.keys(tempData).values()) {
        tlData.push({"key": key, "value": tempData[key]});
    }

    tlData.sort(function (a, b) { return new Date(a.key) - new Date(b.key); })

    // console.log(tlData);
}

function showTimeline() {

    document.getElementById("timelineid").onmousedown = function (event) { event.preventDefault();};

    const w = 1000;
    const h = 100;

    const margin = {left: 80, right: 80, top: 20, bottom: 30};

    const svg = d3.select("#timelineid").append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .on("mousedown.drag", null);


    const upperText = svg.append("g").attr("transform", "translate(" + [margin.left, 0] + ")");

    const timeline = svg.append("g")
        .attr("transform", "translate(" + [margin.left, margin.top] + ")")
        .on("mousedown.drag", null);

    const y = d3.scaleLinear()
        .domain([0, d3.max(tlData, function (d) {
            return d.value.length;
        })])
        .range([h, 0]);

    var yAxis = d3.axisLeft()
        .ticks(4)
        .scale(y);
    timeline.append("g").call(yAxis);

    var x = d3.scaleTime()
        .domain(d3.extent(tlData, function(d) {
            return new Date(d.key);
        }))
        .range([0,w]);


    var xAxis = d3.axisBottom()
        .ticks(d3.timeYear.every(1))
        .scale(x)
        .tickFormat(function(d) {
            let date = new Date(d);
            if (date.getDate() === 1 && date.getMonth() === 0) {
                return date.getFullYear();
            }
        });

    timeline.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .selectAll("text")
        //.attr("text-anchor","end")
        //.attr("transform","rotate(-90)translate(-12,-15)")

    if (mode === 0) {

        var pad = 0;

        var rect_width = w / tlData.length - 2 * pad;

        var rects = timeline.selectAll("rect")
            .data(tlData)
            .enter()
            .append("rect")
            .attr("id", function(d, i) {return "tl" + i})
            .attr("x", function(d, i) {
                return pad + i * ( w / tlData.length);
            })
            .attr("width",  rect_width )//wir teilen die Breite gleichmäßig auf
            .attr("fill","steelblue")
            .attr("y", h)
            .transition()
            .duration(1000)
            .attr("y", function(d) { return y(d.value.length); })
            .attr("height", function(d) { return h-y(d.value.length); });

        rects = timeline.selectAll("rect");

        console.log("hmm");

        function xToI (x) {
            return ( x - pad ) / ( w / tlData.length );
        }

        var title = svg.append("text")
            .style("font-size", "20px")
            .attr("x", w/2 + margin.left)
            .attr("y", 30)
            .attr("text-anchor","middle");

    } else if (mode === 1) {

        timeline.append("path")
            .datum(tlData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 0.5)
            .attr("d", d3.line()
                .x(function(d) {return x(new Date(d.key))})
                .y(function(d) {return y(d.value.length)}));

    }

    const EPSILON = 5;

    let slider = timeline.append("rect")
        .attr("id", "slider")
        .attr("x", 30)
        .attr("y", 0)
        .attr("width", 35)
        .attr("height", h)
        .attr("fill", "steelblue")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .on("mouseover", updateCursor)
        .on("mouseenter", enter)
        .on("mousemove", updateCursor)
        .on("mousedown", startDrag)
        //.on("mouseup", endDrag)
        //.on("mouseleave", leaveSlider)
        ;

    function enter() {
        updateCursor();
    }

    function updateCursor () {
        let elem = document.getElementById("slider");
        let mouseX = Number(d3.mouse(slider.node())[0]);
        let rectLeft = Number(slider.attr("x"));
        let rectRight = rectLeft + Number(slider.attr("width"));

        if (Math.abs(rectLeft - mouseX) < EPSILON || Math.abs(rectRight - mouseX) < EPSILON) {
            elem.style.cursor = "w-resize";
        } else {
            elem.style.cursor = "move";
        }
    }

    let centerDrag = false;
    let leftDrag = false;
    let rightDrag = false;
    let offset = 0;

    let mousePadding = 0;

    let minWidth = 20;
    let maxWidth = 400;

    function startDrag() {

        let mouseX = Number(d3.mouse(this)[0]);
        let rectLeft = Number(slider.attr("x"));
        let rectRight = rectLeft + Number(slider.attr("width"));

        if (Math.abs(rectLeft - mouseX) < EPSILON) {
            leftDrag = true;
        } else if (Math.abs(rectRight - mouseX) < EPSILON) {
            rightDrag = true;
        } else {
            centerDrag = true;
        }
        offset = mouseX - rectLeft;
        //console.log(offset);
        // save difference between mouse and left side
    }

    function drag() {
        if (centerDrag || leftDrag || rightDrag) {
            // console.log(d3.mouse(this));
            let oldL = Number(slider.attr("x"));
            let oldR = Number(slider.attr("x")) + Number(slider.attr("width"));

            // console.log(this);

            let mouseX = d3.mouse(slider.node())[0];

            if (centerDrag) {
                let newL = Number(mouseX) - Number(offset);
                let width = Number(slider.attr("width"))
                let newR = newL + width;
                // console.log(l + " " + r);
                if (newL <= 0) {
                    slider.attr("x", 0);
                } else if (newR >= w) {
                    slider.attr("x", w - width);
                } else {
                    slider.attr("x", newL);
                }
            } else if (leftDrag) {
                let newL = Number(mouseX) - mousePadding;
                let newR = oldR;

                //console.log("leftDrag " + newL + " " + newR);

                if (newL <= 0) {
                    slider.attr("x", 0).attr("width", newR);
                } else if (newR - newL <= minWidth) {
                    slider.attr("x", newR - minWidth).attr("width", minWidth);
                } else {
                    slider.attr("x", newL).attr("width", newR - newL);
                }

            } else if (rightDrag) {
                let newL = oldL;
                let newR = Number(mouseX) + mousePadding;

                //console.log("rightDrag " + newL + " " + newR);

                if (newR >= w) {
                    slider.attr("width", w - newL);
                } else if (newR - newL <= minWidth) {
                    slider.attr("width", minWidth);
                } else {
                    slider.attr("width", newR - newL);
                }

            }

            highlightSliderRects(slider, rects, xToI, upperText);
        }
    }

    function endDrag() {
        if (centerDrag || leftDrag || rightDrag) {
            centerDrag = false;
            leftDrag = false;
            rightDrag = false;
            offset = 0;
            dataByTimeline(slider, rects, xToI, upperText);
            updateEverything();
        }
    }

    function leaveSlider() {
        // do nothing
    }

    d3.select("body")
        .on("mousemove", drag)
        .on("mouseup", endDrag);

    dataByTimeline(slider, rects, xToI, upperText);

}

function highlightSliderRects(slider, rects, xToI, upperText) {
    let l = Number(slider.attr("x"));
    let r = l + Number(slider.attr("width"));

    let start = Math.max(Math.floor(xToI(l)), 0);
    let end = Math.min(Math.ceil(xToI(r)), tlData.length - 1);

    let firstDate = new Date(tlData[start].key);
    let lastDate = new Date(tlData[end].key);

    console.log(firstDate);
    console.log(lastDate);

    upperText.selectAll("*").remove();

    upperText.append("text")
        .text(firstDate.toLocaleDateString())
        .attr("x", function () {
            return l - this.getComputedTextLength();
        })
        .attr("y", 15);

    upperText.append("text")
        .text(lastDate.toLocaleDateString())
        .attr("x", r)
        .attr("y", 15);

    return rects
        .attr("fill", function (d, i) { return (i >= start && i <= end) ? "red" : "steelblue" });
}

function dataByTimeline(slider, rects, xToI, upperText) {
    let l = Number(slider.attr("x"));
    let r = l + Number(slider.attr("width"));

    let start = Math.max(Math.floor(xToI(l)), 0);
    let end = Math.min(Math.ceil(xToI(r)), tlData.length - 1);

    let selectedData = highlightSliderRects(slider, rects, xToI, upperText)
        .filter(function (d, i) { return i >= start && i <= end})
        .data();

    // console.log(selectedData);

    selected = selectedData.reduce(function (acc, current) {acc.push(...current.value); return acc}, []);
}

function handleMouseOver(d, i) {  // Add interactivity
    // Use D3 to select element, change color
    d3.select(this).transition().duration(100).style("opacity", 1.0);
    // d3.select(this).attr("r", 50);
}

function handleMouseOut(d, i) {
    // Use D3 to select element, change color back to normal
    d3.select(this).transition().duration(100).style("opacity", opacity);
    // d3.select(this).attr("r",function(d) { return d.r});
}

function appendInformation(d)
{
    d.LatLng = new L.LatLng(d.lat, d.long);
    d.r = radius;
    d.date = new Date(d.y, d.m - 1, d.d);
}

function updatePosition(d)
{
    var newpoint = mymap.latLngToLayerPoint(d.LatLng);
    //var newpoint = {lat: d.p[0], lng: d.p[1]};
    pointPositions.push(newpoint);
}

function updateView()
{
    //clear old positions
    /*
    circles = g.selectAll("circle").data(data);
    circles.exit().remove();

     */
    pointPositions = [];
    selected.forEach(function (index) {
        updatePosition(data[index]);
    })

    // console.log(pointPositions);
    circles.attr("cx",function(d) { return mymap.latLngToLayerPoint(d.LatLng).x});
    circles.attr("cy",function(d) { return mymap.latLngToLayerPoint(d.LatLng).y});

    /*
    if(zoomlevel>mymap.getZoom()){
        data.forEach(function (d){
            d.r = d.r - 1;
        });
        circles.attr("r",function(d) { return d.r});
    }if (zoomlevel < mymap.getZoom()){
    data.forEach(function (d){
        d.r = d.r + 1;
    });
    circles.attr("r",function(d) { return d.r});
    }else{

    }
     */

    bounds = calculateDataBounds(pointPositions);

    var topLeft = bounds[0];
    var bottomRight = bounds[1];

    svg .attr("width", bottomRight.x - topLeft.x + 2*padding)
        .attr("height", bottomRight.y- topLeft.y + 2*padding)
        .style("left", topLeft.x-padding + "px")
        .style("top", topLeft.y-padding + "px");

    g .attr("transform", "translate(" + (-topLeft.x+padding) + ","
        + (-topLeft.y+padding) + ")");

/*
    circles.attr("cx",function(d) { return d.p[0]});
    circles.attr("cy",function(d) { return d.p[1]});
    circles.attr("r", function (d){ return d.r});

    D.forEach(updatePosition);

 */

}

function calculateDataBounds(features)
{
    var minx = 0, miny = 0, maxx = 0, maxy = 0;

    //find maxima
    for(let i=0; i<features.length; i++)
    {
        if(features[i].x > maxx) maxx = features[i].x;
        if(features[i].y > maxy) maxy = features[i].y;
    }

    minx = maxx;
    miny = maxy;

    //find minima
    for(let i=0; i<features.length; i++)
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

function calcTri(){
    console.log(z);
    var pointdeleted = false;
    var queue = new TinyQueue([], function (a,b){
        return b.abs -a.abs;
    });
    var pointsForTri = [];
    for(var b = 0; b < D.length; b++){
        D[b].r = (Math.log10(D[b].frequency + 1) * 30)/z;
        pointsForTri.push(D[b].p);
    }

    var delaunay = new Delaunay(pointsForTri);
    var tri = delaunay.triangulate();

    var D2 = [];
    for(var d = 0; d < tri.length; d++){
        var test = D[searchForArray(D, tri[d])];
        var newD = {p:tri[d], frequency:test.frequency, r:test.r, accidents:test.accidents};
        D2.push(newD);
    }

    let temp, point;
    for (var c = 1; c < D2.length; c = c + 2) {
        temp = Math.sqrt(Math.pow(D2[c - 1].p[0] - D2[c].p[0], 2) + Math.pow(D2[c - 1].p[1] - D2[c].p[1], 2));
        if ((D2[c - 1].r + D2[c].r) > temp) {
            queue.push({pts: [D2[c - 1], D2[c]], abs: temp})
        }
    }
    while(queue.peek() !== undefined){
         point = queue.pop();
         var locSmall, locBig;
         if(point.pts[0].r > point.pts[1].r){
             locBig = searchForArray(D, point.pts[0].p);
             locSmall = searchForArray(D,point.pts[1].p);
         }else{
             locBig = searchForArray(D, point.pts[1].p);
             locSmall = searchForArray(D,point.pts[0].p);
         }
         if(locBig > 0){
             D[locBig].frequency = point.pts[0].frequency + point.pts[1].frequency;
             //D[locBig].sp.push(D[locSmall].sp);
             D[locBig].r = (Math.log10(D[locBig].frequency + 1) * 30)/z;
             D[locBig].accidents = point.pts[0].accidents.concat(point.pts[1].accidents);
             D.splice(locSmall,1);
             pointdeleted = true;
         } else{
             //console.log("Point already deleted.");
         }
    }
    if(pointdeleted){
        console.log("Run finished.");
        //calcLatLngMean();
        calcTri();
    }
    //calcLatLngMean();
    console.log("finish");
    console.log(D);
}

function compareArray(x,y){
    if(x == null){
        return false;
    }
    if(y == null){
        return false;
    }
    if(x.length !== y.length){
        return false;
    }
    for(j = 0; j < x.length; j++){
        if(x[j] !== y[j]){
            return false;
        }
    }
    return true;
}

function searchForArray(haystack, needle){
    var i, j, current;
    for(i = 0; i < haystack.length; ++i){
        if(needle.length === haystack[i].p.length){
            current = haystack[i].p;
            for(j = 0; j < needle.length && needle[j] === current[j]; ++j);
            if(j === needle.length)
                return i;
        }
    }
    return -1;
}

function displayExtraInfo(){

    let selectElement = document.getElementById("select");
    let valueSelected = selectElement.value;
    svg.selectAll("circle").style("fill", "red");
    d3.select(this).style("fill", "blue");

    switch (valueSelected){
        case "1":
            piechart(d3.select(this).data()[0]);
            break;
        case "2":
            z = mymap.getZoom();
            break;
        case "3":
            chart(d3.select(this).data()[0]);
            break;
        default:
            console.log("If you reach me something realy went wrong");
    }

}

function piechart(accumulated_data){

    var accident_nums = accumulated_data.accidents;

    var relevant_data = [];

    for (let acc_num of accident_nums) {
        relevant_data.push(data[acc_num]);
    }

    var count_options = {};

    for(let acc of relevant_data){
        if (acc["atm"] in count_options){
            count_options[acc["atm"]] += 1;
        }else{
            count_options[acc["atm"]] = 1;
        }
    }
    console.log(count_options);
    var piedata = [];
    for (var key of Object.keys(count_options).values()) {
        piedata.push({"key": key, "value": count_options[key]});
    }
    console.log(piedata);

    var legende = {1:"Normal", 2:"Light rain", 3:"Heavy rain", 4:"Snow", 5:"Fog", 6:"Strong wind", 7:"Dazzling weather", 8:"Cloudy weather", 9:"Other"};

    var w = 300,
        h = 300,
        radius = Math.min(w, h) / 2,
        margin = {left:20,right:15,top:30,bottom:40};

    var extraSVG = d3.select("#extraChart")
        .attr("width", w+margin.left+margin.right)
        .attr("height", h+margin.top+margin.bottom);

    extraSVG.selectAll("*").remove();

    var top = (w / 2)+margin.top;
    var bottom = (h / 2)+margin.bottom;

    var g = extraSVG.append("g")
        .attr("transform", "translate(" + top + "," + bottom + ")");


    // Step 4
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6,7,8,9]).range(['#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd'])
    var ordScale = d3.scaleOrdinal(d3.schemeCategory10 );

    // Step 5
    var pie = d3.pie().value(function(d) {
        return d.value;
    });

    var arc = g.selectAll("arc")
        .data(pie(piedata))
        .enter();

    // Step 6
    var path = d3.arc()
        .outerRadius(radius)
        .innerRadius(0);

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d) { return myColor(d.data.key); });

    arc.selectAll("path").on('mouseover', function (d){
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '.85');
        d3.select("#tooltip")
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY + "px")
            .style("opacity", 1)
            .select("#value")
            .text(legende[d.data.key]);
    })
        .on('mouseout', function (){
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1');
            d3.select("#tooltip")
                .style("opacity", 0);
        });

    // Step 7
    var label = d3.arc()
        .outerRadius(radius)
        .innerRadius(0);

    arc.append("text")
        .attr("transform", function(d) {
            return "translate(" + label.centroid(d) + ")";
        })
        .text(function(d) { return d.data.key; })
        .style("font-family", "arial")
        .style("font-size", 15);


}


function chart(accumulated_data) {
    var accident_nums = accumulated_data.accidents;
    var relevant_data = [];

    for (let acc_num of accident_nums) {
        relevant_data.push(data[acc_num]);
    }
    var count_year = {}, count_month = {}, count_day = {}, count_hour = {};

    var years = [], months = [], days = [], hours = [];

    for (let acc of relevant_data) {
        if (acc["y"] in count_year) {
            count_year[acc["y"]] += 1;
        } else {
            count_year[acc["y"]] = 1;
        }
        if (acc["m"] in count_month) {
            count_month[acc["m"]] += 1;
        } else {
            count_month[acc["m"]] = 1;
        }
        if (acc["d"] in count_day) {
            count_day[acc["d"]] += 1;
        } else {
            count_day[acc["d"]] = 1;
        }
        if (acc["hr"] in count_hour) {
            count_hour[acc["hr"]] += 1;
        } else {
            count_hour[acc["hr"]] = 1;
        }
    }

    for (var key of Object.keys(count_month).values()) {
        months.push({"key": key, "value": count_month[key]});
    }

    months.sort( function (a, b) { return a.key - b.key; });


    var w = 300;
    var h = 300;
    var margin = {left:20,right:15,top:40,bottom:40};
    var parse = d3.timeParse("%m");
    var format = d3.timeFormat("%b");

    var extraSVG = d3.select("#extraChart")
        .attr("width", w+margin.left+margin.right)
        .attr("height", h+margin.top+margin.bottom);

    extraSVG.selectAll("*").remove();


    var g = extraSVG.append("g")
        .attr("transform","translate("+[margin.left,margin.top]+")");

    var y = d3.scaleLinear()
        .domain([0, d3.max(Object.entries(count_month), function(d) { return Number(d[1]); }) ])
        .range([h,0]);

    var yAxis = d3.axisLeft()
        .ticks(4)
        .scale(y);
    g.append("g").call(yAxis);

    var x = d3.scaleBand()
        .domain(d3.range(1, 13))
        .range([0,w]);

    var xAxis = d3.axisBottom()
        .scale(x)
        .tickFormat(function(d) { return format(parse(d)); });

    g.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("text-anchor","end")
        .attr("transform","rotate(-90)translate(-12,-15)")

    console.log(months);

    var pad = 3;

    var rect_width = w / 12 - 2 * pad;

    var rects = g.selectAll("rect")
        .data(months)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return pad + (d.key - 1) * ( w / 12);
        })
        .attr("width",  rect_width )//wir teilen die Breite gleichmäßig auf
        .attr("fill","steelblue")
        .attr("y", h)
        .transition()
        .duration(1000)
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return h-y(d.value); });

    var title = extraSVG.append("text")
        .style("font-size", "20px")
        .attr("x", w/2 + margin.left)
        .attr("y", 30)
        .attr("text-anchor","middle");
}

function updateView2(){

    calcTri();

    circles = g.selectAll("circle")
        .data(D)
        .enter()
        .append("circle")
        .attr("r", radius)
        .style("fill", "red")
        .attr("opacity", opacity)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", displayExtraInfo);

    pointPositions = [];
    D.forEach(updatePosition);
    console.log(pointPositions);
    circles.attr("cx",function(d) { return mymap.latLngToLayerPoint(d.LatLng).x});
    circles.attr("cy",function(d) { return mymap.latLngToLayerPoint(d.LatLng).y});
    circles.attr("r",function(d) { return d.r});

    bounds = calculateDataBounds(pointPositions);

    var topLeft = bounds[0];
    var bottomRight = bounds[1];

    svg .attr("width", bottomRight.x - topLeft.x + 2*padding)
        .attr("height", bottomRight.y- topLeft.y + 2*padding)
        .style("left", topLeft.x-padding + "px")
        .style("top", topLeft.y-padding + "px");

    g .attr("transform", "translate(" + (-topLeft.x+padding) + ","
        + (-topLeft.y+padding) + ")");

}

function preprocessD(){
    setZ();
    var points = [];
    selected.forEach(function (index) {
        var d = data[index];
        kartenpunkt = ([mymap.latLngToLayerPoint(d.LatLng).x, mymap.latLngToLayerPoint(d.LatLng).y]);
        points.push({kp:kartenpunkt, LatLng: d.LatLng, NumAcc: d["Num_Acc"]});
        // console.log("accident number" + d["Num_Acc"]);
    })

    D = [];
    for(var a = 0; a < points.length; a++){
        loc = searchForArray(D,points[a].kp);
        if(loc > 0){
            // hier muessten eigentlich noch informationen angehangen werden
            D[loc].frequency = D[loc].frequency + 1;
            D[loc].accidents.push(points[a].NumAcc);
        }else{
            D.push({p:points[a].kp, frequency:1, r:1, LatLng: points[a].LatLng, sp:[points[a].LatLng], accidents: [points[a].NumAcc]});
        }
    }
}

function calcLatLngMean(){
    D.forEach(function (d){
        var newmeanlat;
        var newmeanlong;
        for(var e = 0; e<d.sp.length; e++){
            newmeanlat += d.sp[e].LatLng.lat;
            newmeanlong += d.sp[e].LatLng.long;
        }
        d.LatLng = {lat: newmeanlat/d.sp.length, lng: newmeanlong/d.sp.length};
        d.sp = [d.LatLng];
    })
}

function updateEverything(){
    g.selectAll("*").remove();
    preprocessD();
    updateView2();
}
function setZ(){
    console.log(mymap.getZoom());
    switch (mymap.getZoom()){
        case 5:
            z = mymap.getZoom()*1.5;
            break;
        case 6:
            z = mymap.getZoom();
            break;
        case 7:
            z = mymap.getZoom()*0.6;
            break;
        case 8:
            z = mymap.getZoom()*0.3;
            break;
        case 9:
            z = mymap.getZoom()*0.3;
            break;
        case 10:
            z = mymap.getZoom()*0.25;
            break;
        case 11:
            z = mymap.getZoom()*0.2;
            break;
        default:
            z=mymap.getZoom();

    }
}






