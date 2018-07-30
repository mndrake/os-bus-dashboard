(function() {

var map;
var locationLayer = new L.FeatureGroup();
var locationData;
var routeSelectize;
var updateTimerInterval;
var refreshTimerInterval;
var startTime;

// 1=South, 2=East, 3=West, 4=North
const direction_colors = {1: '#595490', 2: '#527525', 3: '#A93F35', 4: '#BA48AA'};

// initialize map
map = L.map('busmap').setView([44.87378, -93.26795], 13);
L.tileLayer('https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={apikey}', {
	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	apikey: 'fd8ed47b96ba4a6bb4536f333d25068f',
	maxZoom: 22
}).addTo(map);


var updateMap = function(){
	// remove prior route if exists
	map.removeLayer(locationLayer);
	var markers = [];
	var route_info = locationData;
	// determine which direction checkboxes are checked
	var directions = $("#directions :checkbox")
		.map(function() {
			if (this.checked) {
				return parseInt(this.defaultValue)
			}})
		.get();
	route_info['locations'].forEach(function (row) {
		if (directions.includes(row['Direction'])) {
      var marker = new L.CircleMarker(
        [row['VehicleLatitude'], row['VehicleLongitude']],
        {
          color: direction_colors[row['Direction']],
          opacity: 0.8,
          radius: 8
        }
      );
      markers.push(marker)
    }
    });

	locationLayer = L.featureGroup(markers);

	if (route_info['shape'].length !== 0) {
		var busRoute = L.polyline(route_info['shape'], {fill: false});
		locationLayer.addLayer(busRoute);
	}

	map.fitBounds(locationLayer.getBounds());
	locationLayer.addTo(map);
};


$('.interval-select').selectize({
  options: [
    {value: 30, text: "30 seconds"},
    {value: 60, text: "1 minute"},
    {value: 120, text: "2 minutes"},
    {value: 300, text: "5 minutes"},
    {value: 600, text: "10 minutes"}
  ],
	onInitialize: function(){
  	this.setValue(60);
  	this.trigger('change');
    },
	onChange: function(value) {
  	var val = value;
  	if (value === undefined) {
  		val = this.getValue();
		}
		if (refreshTimerInterval !== undefined) {
  		window.clearInterval(refreshTimerInterval);
		}
		if (routeSelectize !== undefined) {
			routeSelectize.trigger('change');
		}
		refreshTimerInterval = window.setInterval(function() {
			routeSelectize.trigger('change');
		}, val * 1000);
	}
});


$('.route-number-select').selectize({
    onInitialize: function () {
      routeSelectize = this;
      $.get("/api/route-numbers", function (data) {
        routeSelectize.addOption(data);
				routeSelectize.setValue(data[1].value);
				routeSelectize.trigger('change');
      });
    },
		onChange: function(value) {
    	var val = value;
    	if (value === undefined) {
    		val = this.getValue();
			}
			 $.get("/api/route-info/" + val, function (data) {
			 	  locationData = data;
					setUpdateTimer();
				  updateMap();
					$("#routes-southbound").html(data['summary'][1]);
					$("#routes-eastbound").html(data['summary'][2]);
					$("#routes-westbound").html(data['summary'][3]);
					$("#routes-northbound").html(data['summary'][4]);
					$("#routes-total").html(data['summary'][0])
			 })
		}
});

$("#directions :checkbox").change(function() {
	updateMap();
});

function updateTimer(reset) {
	if (reset) {
		startTime = new Date();
	}
	var endTime = new Date();
  var seconds = Math.round((endTime - startTime)/1000);
	$("#timeSinceLastUpdate p").html("Data refreshed " + seconds + " seconds ago.")
}

function setUpdateTimer() {
	if (updateTimerInterval !== undefined) {
		window.clearInterval(updateTimerInterval);
		updateTimer(true);
	}
	updateTimerInterval = window.setInterval(function() {updateTimer(false)}, 5000);
}

$("#zoomButton").click(function() { map.fitBounds(locationLayer.getBounds()); });

$("#refresh").click(function() { routeSelectize.trigger('change'); });

})();
