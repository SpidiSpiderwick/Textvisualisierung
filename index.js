/**
 * example function
 */

let mode = 0;

var data;

let infodisplayed = false;

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
var circleSelected;
var france;
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
    document.getElementById("stLoad").addEventListener("click", standardLoad, false);
    initMap();
}

/**
 * Initialize Map with svg Layer for d3 visualisation
 */

function initMap() {
    mymap = L.map('mapid').setView([48.856614, 2.3522219], 15); //([46.54, 2.44], 6)
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

async function standardLoad() {
    let response = await fetch("data/full_data.json");
    if (response.status !== 200) {
        console.log("could not standard load");
    } else {
        let text_data = await response.text();
        loadJSON(text_data);
    }
}

/**
 * Loads Data when file is selected
 * @param file
 */
function loadFile(file){
    let reader = new FileReader();
    reader.readAsBinaryString(file); //liest die Datei als String ein
    reader.onloadend = function(event){ //gibt an was passiert, wenn die Datei fertig geladen wurde
        loadJSON(reader.result);
    }
}

function loadJSON(file_text) {
    data = JSON.parse(file_text);
    //so its faster for testting

    var limit = Number.MAX_SAFE_INTEGER;
    //let limit = 10;

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
        tlData.push({"key": new Date(key), "value": tempData[key]});
    }

    tlData.sort(function (a, b) { return a.key - b.key; })

    // console.log(tlData);
}

function daysBetween(d1, d2) {
    return Math.floor((d1 >= d2 ? (d1.getTime() - d2.getTime()) : (d2.getTime() - d1.getTime())) / (1000 * 3600 * 24) + 1);
}

function showTimeline() {

    document.getElementById("timelineid").onmousedown = function (event) { event.preventDefault();};

    const w = 1000;
    const h = 100;

    const margin = {left: 80, right: 80, top: 20, bottom: 60};

    d3.select("#timelineid").selectAll("svg").remove();

    const svg = d3.select("#timelineid").append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .on("mousedown.drag", null);

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

    let xDomain = d3.extent(tlData, function(d) {return d.key;});

    xDomain[1] = new Date(xDomain[1]);
    xDomain[1].setDate(xDomain[1].getDate() + 1);
    xDomain[0] = new Date(xDomain[0]);

    let num_of_days = daysBetween(xDomain[0], xDomain[1]);

    var x = d3.scaleTime()
        .domain(xDomain)
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

        var rect_width = w / num_of_days;

        var rects = timeline.selectAll("rect")
            .data(tlData)
            .enter()
            .append("rect")
            .attr("id", function(d, i) {return "tl" + i})
            .attr("x", function(d, i) {
                return x(d.key);
                //return pad + i * ( w / tlData.length);
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
                .x(function(d) {return x(d.key)})
                .y(function(d) {return y(d.value.length)}));

    }

    const EPSILON = 1;

    let slider = timeline.append("rect")
        .attr("id", "slider")
        .attr("x", 965)
        .attr("y", 0)
        .attr("width", 35)
        .attr("height", h)
        .attr("fill", "steelblue")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .on("mouseover", updateCursor)
        .on("mouseenter", updateCursor)
        .on("mousemove", updateCursor)
        .on("mousedown", startDrag)
        //.on("mouseup", endDrag)
        //.on("mouseleave", leaveSlider)
        ;

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

    let minWidth = rect_width;
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

    function roundDown(x) {return Math.floor(x / rect_width) * rect_width;}
    function roundUp(x) {return Math.ceil(x / rect_width) * rect_width;}

    function drag() {
        if (centerDrag || leftDrag || rightDrag) {
            // console.log(d3.mouse(this));
            let oldL = Number(slider.attr("x"));
            let oldR = Number(slider.attr("x")) + Number(slider.attr("width"));

            // console.log(this);

            let mouseX = d3.mouse(slider.node())[0];

            if (centerDrag) {
                let newL = roundDown(Number(mouseX) - Number(offset));
                let width = roundDown(Number(slider.attr("width")));
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
                let newL = roundDown(Number(mouseX) - mousePadding);
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
                let newR = roundUp(Number(mouseX) + mousePadding);

                //console.log("rightDrag " + newL + " " + newR);

                if (newR >= w) {
                    slider.attr("width", w - newL);
                } else if (newR - newL <= minWidth) {
                    slider.attr("width", minWidth);
                } else {
                    slider.attr("width", newR - newL);
                }

            }

            highlightSliderRects(slider, rects, x.invert, startDP, endDP, lowerText);
        }
    }

    function endDrag() {
        if (centerDrag || leftDrag || rightDrag) {
            centerDrag = false;
            leftDrag = false;
            rightDrag = false;
            offset = 0;
            dataByTimeline(slider, rects, x.invert, startDP, endDP, lowerText);
            updateEverything();
        }
    }

    function leaveSlider() {
        // do nothing
    }

    d3.select("body")
        .on("mousemove", drag)
        .on("mouseup", endDrag);

    const startDP = datepicker("#leftText",
        {id: 1,
            onSelect: troll,
            onShow: showSibling,
            dateSelected: new Date("2007-06-30"),
            position: "tl",
            formatter: (input, date, instance) => {
                input.value = date.toLocaleDateString();
            },
            disabler: date => date < xDomain[0] || date > xDomain[1]
        });
    startDP.calendarContainer.style.setProperty('font-size', '0.7rem');

    const endDP = datepicker("#rightText",
        {id: 1,
            onSelect: troll,
            onShow: showSibling,
            //onHide: endHide,
            dateSelected: new Date("2008-06-30"),
            position: "tr",
            formatter: (input, date, instance) => {
                input.value = date.toLocaleDateString();
            },
            disabler: date => date < xDomain[0] || date > xDomain[1]
        });
    endDP.calendarContainer.style.setProperty('font-size', '0.7rem');

    function troll (instance) {
        let range = instance.getRange();
        let startX = x(range.start);
        let width = x(range.end) - startX;
        slider.attr("x", startX).attr("width", width);
        dataByTimeline(slider, rects, x.invert, startDP, endDP, lowerText);
        updateEverything();
        instance.show();
    }

    function showSibling (instance) {
        if(instance.sibling.calendarContainer.classList.contains("qs-hidden")) {
            instance.sibling.show();
        }
    }

    const startElem = document.getElementById("leftText");
    const endElem = document.getElementById("rightText");

    startElem.onclick = function (event) {startDP.show(); event.stopPropagation();};
    endElem.onclick = function (event) {endDP.show(); event.stopPropagation()};

    // startDP.calendarContainer.onclick = function (event) { startDP.calendarContainer.onclick(); event.stopPropagation(); };
    // endDP.calendarContainer.onclick = function (event) { endDP.calendarContainer.onclick(); event.stopPropagation(); };

    const lowerText = document.getElementById("daysChosen");

    dataByTimeline(slider, rects, x.invert, startDP, endDP, lowerText);

}

function highlightSliderRects(slider, rects, x_invert, startDP, endDP, lowerText, filter=false) {
    let l = Number(slider.attr("x"));
    let r = l + Number(slider.attr("width"));

    let firstDate = x_invert(l);
    firstDate.setHours(0, 0, 0, 0);

    let lastDate = x_invert(r);
    lastDate.setHours(0, 0, 0, 0);

    console.log(firstDate);
    console.log(lastDate);

    startDP.setDate();
    endDP.setDate();
    startDP.setDate(firstDate, true);
    endDP.setDate(lastDate, true);

    lowerText.innerHTML = `${daysBetween(firstDate, lastDate)} days chosen`;

    rects.attr("fill", function (d, i) { return (d.key >= firstDate && d.key <= lastDate) ? "red" : "steelblue" });

    return filter ? rects.filter(function (d, i) { return d.key >= firstDate && d.key <= lastDate}) : rects;
}

function dataByTimeline(slider, rects, x_invert, startDP, endDP, lowerText) {
    let selectedData = highlightSliderRects(slider, rects, x_invert, startDP, endDP, lowerText, true).data();
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

function displayOnChange(){
    let valueSelected = document.getElementById("select").value;
    let bar = document.getElementById("chartMode").checked;

    console.log(chartMode);

    let data = circleSelected.data()[0];

    switch (valueSelected){
        case "1":
            weatherchart(data, bar);
            break;
        case "2":
            lumchart(data, bar);
            break;
        case "3":
            datechart(data, bar);
            break;
        case "4":
            injurychart(data, bar);
            break;
        case "5":
            pieSurf(data, bar);
            break;
        default:
            console.log("If you reach me something really went wrong");
    }
}

function displayExtraInfo(){

    svg.selectAll("circle").style("fill", "red");
    circleSelected = d3.select(this).style("fill", "blue");

    displayOnChange();

}

function lumchart(accumulated_data, bar){
    var accident_nums = accumulated_data.accidents;
    var relevant_data = [];
    for (let acc_num of accident_nums) {
        relevant_data.push(data[acc_num]);
    }
    var count_options = {};
    for(let acc of relevant_data){
        if (acc["lum"] in count_options){
            count_options[acc["lum"]] += 1;
        }else{
            count_options[acc["lum"]] = 1;
        }
    }
    var piedata = [];
    for (var key of Object.keys(count_options).values()) {
        piedata.push({"key": key, "value": count_options[key]});
    }
    var legende = {1:"Full day", 2:"Twilight or dawn", 3:"Night without public lighting", 4:"Night with public lighting not lit", 5:"Fog", 6:"Night with public lighting on"};
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6]).range(['#d73027','#fc8d59','#fee08b','#d9ef8b','#91cf60','#1a9850']);

    let chart = bar ? barchart : piechart;

    chart(piedata, legende, '#tooltipLight', '#valueLight', myColor);

}

function weatherchart(accumulated_data, bar){
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
    var chartdata = [];
    for (var key of Object.keys(count_options).values()) {
        chartdata.push({"key": key, "value": Number(count_options[key])});
    }
    var legende = {1:"Normal", 2:"Light rain", 3:"Heavy rain", 4:"Snow", 5:"Fog", 6:"Strong wind", 7:"Dazzling weather", 8:"Cloudy weather", 9:"Other"};
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6,7,8,9]).range(['#e74c3c','#e66b4f','#f39c12','#f1c40f','#16a085','#2ecc71','#3498db','#8e44ad','#2c3e50']);
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6,7,8,9]).range(['#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd','#ffffbf']);
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6,7,8,9]).range([['#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4']]);
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6,7,8,9]).range(['#d73027','#abd9e9','#74add1','#4575b4','#ffffbf','#e0f3f8','#f46d43','#fdae61','#fee090']);

    let chart = bar ? barchart : piechart;

    chart(chartdata, legende, '#tooltip', '#value', myColor);
}

function datechart(accumulated_data, bar) {
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

function injurychart(accumulated_data, bar){
    var accident_nums = accumulated_data.accidents;
    var relevant_data = [];
    for (let acc_num of accident_nums) {
        relevant_data.push(data[acc_num]);
    }
    var count_options = {};
    for(let acc of relevant_data){
        if (acc["grav"] in count_options){
            count_options[acc["grav"]] += 1;
        }else{
            count_options[acc["grav"]] = 1;
        }
    }
    var piedata = [];
    for (var key of Object.keys(count_options).values()) {
        piedata.push({key: key, value: count_options[key]});
    }
    var legende = {1:"Unscathed", 2:"Killed", 3:"Hospilalized wounded", 4:"Light injury"};
    var myColor = d3.scaleOrdinal().domain([1,2,3,4]).range(['#1a9850','#d53e4f','#f46d43','#66bd63']);

    let chart = bar ? barchart : piechart;

    chart(piedata, legende, '#tooltipInjury', '#valueInjury',myColor);

}

function pieSurf(accumulated_data, bar){
    var accident_nums = accumulated_data.accidents;
    var relevant_data = [];
    for (let acc_num of accident_nums) {
        relevant_data.push(data[acc_num]);
    }
    var count_options = {};
    for(let acc of relevant_data){
        if (acc["surf"] in count_options){
            count_options[acc["surf"]] += 1;
        }else{
            if(parseInt(acc["surf"]) > 0){
                count_options[acc["surf"]] = 1;
            }

        }
    }
    var piedata = [];
    for (var key of Object.keys(count_options).values()) {
        piedata.push({"key": key, "value": count_options[key]});
    }
    console.log(piedata);
    var legende = {1:"Normal", 2:"Wet", 3:"Puddles", 4:"Flooded", 5:"Snow", 6:"Mud", 7:"Icy", 8:"Fat-Oil", 9:"Other"};
    var myColor = d3.scaleOrdinal().domain([1,2,3,4,5,6,7,8,9]).range(['#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850','#ffffbf']);

    let chart = bar ? barchart : piechart;

    chart(piedata, legende, '#tooltipSurf', '#valueSurf', myColor)
}

function barchart(bardata, legende, tooltip, value, myColor) {
    var w = 300;
    var h = 300;
    var margin = {left:40,right:15,top:40,bottom:150};

    var extraSVG = d3.select("#extraChart")
        .attr("width", w+margin.left+margin.right)
        .attr("height", h+margin.top+margin.bottom);

    extraSVG.selectAll("*").remove();

    var g = extraSVG.append("g")
        .attr("transform","translate("+[margin.left,margin.top]+")");

    let y = d3.scaleLinear()
        .domain([0, d3.max(bardata, function (d) {return d.value;}) ])
        .range([h,0]);

    let yAxis = d3.axisLeft()
        .ticks(4)
        .scale(y);
    g.append("g").call(yAxis);

    let x = d3.scaleBand()
        .domain(bardata.map(function(d) {return d.key}))
        .range([0,w])
        .padding(0.3);

    let xAxis = d3.axisBottom()
        .scale(x)
        .tickFormat(function(d) { return legende[d]; });

    g.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("text-anchor","end")
        .attr("transform","rotate(-45)translate(-5,0)");

    g.selectAll("mybar")
        .data(bardata)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return x(d.key);
        })
        .attr("fill", function(d, i) {
            return myColor(d.key);
        })
        .attr("y", h)
        .attr("width", x.bandwidth())
        .transition()
        .duration(1000)
        .attr("y", function(d) {
            return y(d.value);
        })
        .attr("height", function(d) { return h-y(d.value); });

}

function piechart(piedata, legende, tooltip, value, myColor){

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
        d3.select(tooltip)
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY + "px")
            .style("opacity", 1)
            .select(value)
            .text(legende[d.data.key]);
    })
        .on('mouseout', function (){
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1');
            d3.select(tooltip)
                .style("opacity", 0);
        });

    // Step 7
    var gesa = 0;
    piedata.forEach(function (d){
        gesa = gesa + d.value;
    })
    var label = d3.arc()
        .outerRadius(radius)
        .innerRadius(0);

    arc.append("text")
        .attr("transform", function(d) {
            return "translate(" + label.centroid(d) + ")";
        })
        .text(function(d) { return ((((d.data.value)/gesa).toFixed(2))*100).toFixed(0) + '%'; })
        .style("font-family", "arial")
        .style("font-size", 12);

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
        points.push({kp:kartenpunkt, LatLng: d.LatLng, NumAcc: index});
        // console.log("accident number" + index);
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
        case 12:
            z = mymap.getZoom()*0.3;
            break;
        case 13:
            z = mymap.getZoom()*0.3;
            break;
        case 14:
            z = mymap.getZoom()*0.275;
            break;
        default:
            z=mymap.getZoom()*0.15;

    }
}

function loadGeoJson(){
    geojson = L.geoJson(france, {
        style: styleFrance,
        onEachFeature: onEachFeature

    }).addTo(mymap);

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    function styleFrance(feature) {
        return {
            fillColor: d3.scaleOrdinal(d3.schemeCategory10 ),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }
    function resetHighlight(e) {
        geojson.resetStyle(e.target);
    }
    function zoomToFeature(e) {
        mymap.fitBounds(e.target.getBounds());
    }
}

france = loadFrance();

async function loadFrance () {
    let response = await fetch("data/france.coords");
    if (response.status !== 200) {
        console.log("could not load geo data");
    } else {
        return JSON.parse(await response.text());
    }
}

