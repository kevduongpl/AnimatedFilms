var headers;
var countries;

var root;

var margin = 100; 
var width = 800  - margin * 2;
var height = 800 - margin * 2;

var xScale = d3.scale.linear()
    .range([0, width]);

var yScale = d3.scale.linear()
    .range([height, 0]);
	

//var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(d3.format("d"));
var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
var yAxis = d3.svg.axis().scale(yScale).orient("left");

var years;
var filteredData;
var xMinDefault;
var yMinDefault;
var xMaxDefault;
var yMaxDefault;

var xMinCurrent;
var yMinCurrent;
var xMaxCurrent;
var yMaxCurrent;

var yearMax;
var yearMin;

var yearMinCurrent;
var yearMaxCurrent;

var tradChecked = true;
var cgChecked = true;

var countries = [];
var studios = [];

var countryIndex = 0;
var studioIndex = 0;

var circleR = 6;

//Tooltip for hovering over points
var tip = d3.tip()
	.attr("class", "d3-tip")
	.offset([-10, 0])
	.html(function(d){
		return "<center><strong>" + d.Title + "</strong></center><br>" +
				"<strong>Year: </strong>" + d.Year + "<br>" +
				"<strong>Budget: </strong>" + accounting.formatMoney(d.Budget, "$", 0) + "<br>" +
				"<strong>Box Office: </strong>" + accounting.formatMoney(d.Box_Office, "$", 0) + "<br>" +
				"<strong>RT Rating: </strong>" + rtParse(d.RT_rating);
	});
	
formatData();
createVis();
updateVis();
rectSelect();
createDropdown();
createLegend();
createSlider();
autoPlay();

function formatData() {
	filteredData = movieData.filter(
		function(d){
			return (d.Budget != 0 && d.Box_Office != 0 && d.Box_Office
				!= "N/A" && d.Budget != "N/A")
		}
	);
	
	for (var i = 0; i < filteredData.length; i++){
		for (var j = 0; j < filteredData[i].Country.length; j++){
			countries.push(filteredData[i].Country[j]);
		}
		for (var k = 0; k < filteredData[i].Studio.length; k++){
			studios.push(filteredData[i].Studio[k]);
		}
	}
	
	countries = sortByFrequencyAndRemoveDuplicates(countries);
	studios = sortByFrequencyAndRemoveDuplicates(studios);
	
	countries.unshift("(All Countries)");
	studios.unshift("(All Studios)");
	
	yearMin = d3.min(filteredData, function (d) { return d.Year;});	
	yearMax = d3.max(filteredData, function (d) { return d.Year;});
	
	xMinDefault = 0;
	yMinDefault = 0;
	xMaxDefault = d3.max(filteredData, function (d) { return d.Budget;});
	yMaxDefault = d3.max(filteredData, function (d) { return d.Box_Office;});
	
	d3.select("#resetButton")
		.attr("disabled", "");
}

function rtParse(num){
	if (num == "N/A"){
		return "N/A";
	}
	num = num * 100;
	num = num.toFixed(0);
	return "<span style='color:" + getGreenToRed(num) + "'>" + num + "%";
}

//color code from: http://stackoverflow.com/a/18085357
function getGreenToRed(percent){
            r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
            g = percent>50 ? 255 : Math.floor((percent*2)*255/100);
            return 'rgb('+r+','+g+',0)';
}

//code from: http://stackoverflow.com/a/3579651
function sortByFrequencyAndRemoveDuplicates(array) {
    var frequency = {}, value;

    // compute frequencies of each value
    for(var i = 0; i < array.length; i++) {
        value = array[i];
        if(value in frequency) {
            frequency[value]++;
        }
        else {
            frequency[value] = 1;
        }
    }

    // make array from the frequency object to de-duplicate
    var uniques = [];
    for(value in frequency) {
        uniques.push(value);
    }

    // sort the uniques array in descending order by frequency
    function compareFrequency(a, b) {
        return frequency[b] - frequency[a];
    }

    return uniques.sort(compareFrequency);
}

function createVis() {
	xMinCurrent = xMinDefault;
	yMinCurrent = yMinDefault;
	xMaxCurrent = xMaxDefault;
	yMaxCurrent = yMaxDefault;
	
	xScale.domain([xMinCurrent, xMaxCurrent]);
	yScale.domain([yMinCurrent, yMaxCurrent]);
	
	root = d3.select("#graphics");
	root.call(tip);
	
	root = root.append("g")
		.attr("transform", "translate(" + margin + "," + margin/2 + ")");
	root.append("g")
		.attr("class", "yAxis")
		.call(yAxis)
			.append("text")
			.attr("class", "label")
			.attr("transform", "rotate(-90)")
			.attr("y", -70)
			.attr("x", -width/2)
			.attr("dy", ".71em")
			.style("text-anchor", "end");
	
	root.append("g")
	.attr("class", "xAxis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis)
		.append("text")
		.attr("class", "label")
		.attr("x", width/2)
		.attr("y", 40)
		.style("text-anchor", "end");
		
	root.append("g")
	.attr("class","evenLine")
		.append("line")
		.attr("class", "even");
	
	root.selectAll(".movie").data(filteredData)
		.enter()
		.append("g")
		.attr("class", "movie")
		.append("circle")
		.on('mouseover', function(d){
			if (d.Year > yearMaxCurrent || 
				(d.Technique == "Traditional" && tradChecked == false) || 
				(d.Technique == "CG Animation" && cgChecked == false) ||
				(countryIndex != 0 &&  d.Country.indexOf(countries[countryIndex]) <= -1)||
				(studioIndex != 0 &&  d.Studio.indexOf(studios[studioIndex]) <= -1)){
					return;
			}
			d3.select(this).attr("r", circleR + 2);
			tip.show(d);
		})
		.on('mouseout', function(d){
			if (d.Year > yearMaxCurrent || 
				(d.Technique == "Traditional" && tradChecked == false) || 
				(d.Technique == "CG Animation" && cgChecked == false) ||
				(countryIndex != 0 &&  d.Country.indexOf(countries[countryIndex]) <= -1)||
				(studioIndex != 0 &&  d.Studio.indexOf(studios[studioIndex]) <= -1)){
					return;
			}
			d3.select(this).attr("r", circleR);
			tip.hide(d);
		});
	
	root.selectAll(".movie")
	.select("circle")
		.attr("transform", function(d) {
			var xValue = xScale(d.Budget);
			var yValue = yScale(d.Box_Office);
			
			return "translate(" +
				xValue + "," + 
				yValue + ")";
		})
		.attr("fill", function(d){
			if (d.Technique == "Traditional")
				return "#ff0000";
			else
				return "#0000ff";
		});
}

function updateVis() {
	xScale.domain([xMinCurrent, xMaxCurrent]);
	yScale.domain([yMinCurrent, yMaxCurrent]);
	
	xAxis.tickFormat(d3.format("s"));
	yAxis.tickFormat(d3.format("s"));
	
	root.select(".xAxis").call(xAxis)
		.select(".label").text("Budget");
	root.select(".yAxis").call(yAxis)
		.select(".label").text("Box Office");
		
	root.selectAll(".evenLine")
		.transition()
		.select("line")
			.attr("x1", xScale(Math.max(xMinCurrent, yMinCurrent)))
			.attr("y1", yScale(Math.max(xMinCurrent, yMinCurrent)))
			.attr("x2", xScale(xMaxCurrent))
			.attr("y2", function(){
				var line = root.selectAll(".evenLine").select("line")
				line.attr("opacity", 0.5);
				
				if (xScale(xMaxCurrent) < xScale(Math.max(xMinCurrent, yMinCurrent)))
					line.attr("opacity", 0);
				return yScale(xMaxCurrent);
			});
	
	root.selectAll(".movie")
		.select("circle")
			.transition()
			.duration(100)
			.attr("opacity", function(d){
				if (d.Budget < xMinCurrent || d.Budget > xMaxCurrent
					|| d.Box_Office < yMinCurrent || d.Box_Office > yMaxCurrent){
						return 0;
				}
				return 0.5;
			})
			.duration(200)
			.attr("transform", function(d) {
				var xValue = xScale(d.Budget);
				var yValue = yScale(d.Box_Office);
				
				return "translate(" +
					xValue + "," + 
					yValue + ")";
			})
			.attr("r", function(d){
				if (d.Year > yearMaxCurrent || 
					(d.Technique == "Traditional" && tradChecked == false) || 
					(d.Technique == "CG Animation" && cgChecked == false) ||
					(countryIndex != 0 &&  d.Country.indexOf(countries[countryIndex]) <= -1)||
					(studioIndex != 0 &&  d.Studio.indexOf(studios[studioIndex]) <= -1)){
						
					return 0;
				}
				
				return circleR;
			})
}

function rectSelect() {
	var svg = d3.select("#graphics");
	var mouseStart;
	
	//Modified version of http://bl.ocks.org/lgersman/5311083
	//Set rectangle selection
	svg.on("mousedown", function(){
		mouseStart = d3.mouse(this)
		svg.append("rect")
			.attr("class", "select")
			.attr("x", mouseStart[0])
			.attr("y", mouseStart[1])
			.attr("width", 0)
			.attr("height", 0)})
		.on("mousemove", function(){
			s = svg.select("rect.select");
			
			if( !s.empty()) {
			var p = d3.mouse( this),

				d = {
					x       : parseInt( s.attr( "x"), 10),
					y       : parseInt( s.attr( "y"), 10),
					width   : parseInt( s.attr( "width"), 10),
					height  : parseInt( s.attr( "height"), 10)
				},
				move = {
					x : p[0] - d.x,
					y : p[1] - d.y
				}
			;

			if( move.x < 1 || (move.x*2<d.width)) {
				d.x = p[0];
				d.width -= move.x;
			} else {
				d.width = move.x;       
			}

			if( move.y < 1 || (move.y*2<d.height)) {
				d.y = p[1];
				d.height -= move.y;
			} else {
				d.height = move.y;       
			}
			   
        s.attr( d);
			}
		})
	.on( "mouseup", function() {
		var x1 = mouseStart[0]- margin;
		var x2 = d3.mouse(this)[0] - margin;
		var y1 = mouseStart[1]- margin/2;
		var y2 = d3.mouse(this)[1] - margin/2;
		
		if(x1 < x2){
			if (xScale.invert(x1) > 0){
				xMinCurrent = xScale.invert(x1);
				xMaxCurrent = xScale.invert(x2);
			}
			else{
				xMinCurrent = 0;
				xMaxCurrent = xScale.invert(x2);
			}
		}
		else if (x1 > x2){
			if (xScale.invert(x2) > 0){
				xMinCurrent = xScale.invert(x2);
				xMaxCurrent = xScale.invert(x1);
			}
			else{
				xMinCurrent = 0;
				xMaxCurrent = xScale.invert(x1);
			}
		}
		
		if (y1 > y2){
			if (yScale.invert(y1) > 0){
				yMinCurrent = yScale.invert(y1);
				yMaxCurrent = yScale.invert(y2);
			}
			else{
				yMinCurrent = 0;
				yMaxCurrent = yScale.invert(y2);
			}
		}
		else if (y1 < y2){
			if (yScale.invert(y2) > 0){
				yMinCurrent = yScale.invert(y2);
				yMaxCurrent = yScale.invert(y1);
			}
			else{
				yMinCurrent = 0;
				yMaxCurrent = yScale.invert(y1);
			}
		}
		
		//console.log(yMinCurrent + "-" + yMaxCurrent);
		//xScale.domain([mouseStart[0], d3.mouse(this)[0]]);
		//yScale.domain([mouseStart[1], d3.mouse(this)[1]]);
		d3.select("#resetButton")
			.attr("disabled", null);
		svg.select(".select").remove();
		updateVis();
	});
}

function createLegend(){
	var marginLegend = 25;
	var legend = d3.select("#legend")
	
	legend.append("circle")
		.attr("r", 6)
		.attr("fill", "#ff0000")
		.attr("opacity", "0.5")
		.attr("transform", "translate(" + (marginLegend + 10)  + "," + marginLegend + ")");
		
	legend.append("circle")
		.attr("r", 6)
		.attr("fill", "#0000ff")
		.attr("opacity", "0.5")
		.attr("transform", "translate(" + (marginLegend + 10) + "," + (marginLegend + 30) + ")");
	
	legend.append("text")
		.attr("transform", "translate(" + (marginLegend + 20) + "," + (marginLegend + 5) + ")")
		.text("Traditional");
		
	legend.append("text")
		.attr("transform", "translate(" + (marginLegend + 20) + "," + (marginLegend + 35) + ")")
		.text("CG");
	
	legend.append("input")
		.attr("transform", "translate(" + (marginLegend + 20+50) + "," + (marginLegend + 35) + ")")
		.attr("type","checkbox")
		.attr("id", "testCheck")
		.attr("checked", "true")
		.attr("onChange", "movieFilter()");
	
}

function createDropdown() {
	countryDrop = d3.select("#countryFilter");
	countryDrop.selectAll("option")
			.data(countries).enter()
			.append("option")
			.text(function(d) { return d; });
			
	countryDrop.on("change", function(d) {
			var selectedIndex = d3.select(this).property('selectedIndex');
			countryIndex = selectedIndex;
			updateVis();
	});
			
	studioDrop = d3.select("#studioFilter");
	studioDrop.selectAll("option")
			.data(studios).enter()
			.append("option")
			.text(function(d) { return d; });
			
	studioDrop.on("change", function(d) {
			var selectedIndex = d3.select(this).property('selectedIndex');
			studioIndex = selectedIndex;
			updateVis();
	});
}

function movieFilter(){
	if (document.getElementById("tradCheck").checked)
		tradChecked = true;
	else
		tradChecked = false;
	
	if (document.getElementById("cgCheck").checked)
		cgChecked = true;
	else
		cgChecked = false;
	
	updateVis();
}

function createSlider(){
	var slider = d3.select("#yearSlider");
	var titleLabel = d3.select("#yearTitle")
	slider.attr("min", yearMin)
		.attr("max", yearMax)
		.attr("value", yearMin);
	slideLabel = d3.select("#yearRange");
	slideLabel.text("(" + yearMin + "-" + yearMin + ")");
	titleLabel.text("(" + yearMin + "-" + yearMin + ")");
	yearMinCurrent = yearMin;
	yearMaxCurrent = yearMin;
	updateVis();
}

function updateSlider(val){
	var slideLabel = d3.select("#yearRange");
	var titleLabel = d3.select("#yearTitle")
	
	slideLabel.text("(" + yearMin + "-" + val + ")");
	titleLabel.text("(" + yearMin + "-" + val + ")");
	yearMaxCurrent = val;
	updateVis();
}

function autoPlay(){
	var val = parseInt(document.getElementById("yearSlider").value);
	var slider = d3.select("#yearSlider")
		.attr("disabled","");
	var titleLabel = d3.select("#yearTitle")
	var autoButton = d3.select("#autoButton")
		.attr("disabled","")
		.attr("value", "Auto Sliding...");
		
	
	var auto = setInterval(function(){
		console.log(val < yearMax);
		if(val < yearMax){
			val = val + 1;
			document.getElementById("yearSlider").value = val;
			
			slideLabel = d3.select("#yearRange");
			slideLabel.text("(" + yearMin + "-" + val + ")");
			titleLabel.text("(" + yearMin + "-" + val + ")");
			yearMaxCurrent = val;
			updateVis();
		}
		else{
			clearInterval(auto);
			slider.attr("disabled", null);
			autoButton.attr("disabled", null)
				.attr("value", "Auto Slide");
		}
	}, 200);
}

function resetGraph(){
	xMinCurrent = xMinDefault;
	yMinCurrent = yMinDefault;
	xMaxCurrent = xMaxDefault;
	yMaxCurrent = yMaxDefault;
	
	d3.select("#resetButton")
		.attr("disabled", "");
	updateVis();
}