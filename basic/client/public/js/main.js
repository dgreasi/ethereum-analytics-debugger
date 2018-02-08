// add scripts

$(document).on('ready', function() {

	price_chart = document.getElementById('price_chart');
	// quantity_chart = document.getElementById('price_chart');

	var data_chart = price_chart.getAttribute('data-for');
	var dataToArray_chart = data_chart.split(",");
	// console.log("TEST: " + JSON.stringify(data));

	var blocks = [];
	var prices = [];
	var quantity = [];

	for (var i = 0; i < dataToArray_chart.length; i=i+4) {
		blocks.push(dataToArray_chart[i]);
		prices.push(dataToArray_chart[i+1]);
		quantity.push(dataToArray_chart[i+2]);
	}

	// console.log("Blocks: " + blocks[0]);
	// console.log("Prices: " + prices[0]);
	// console.log("Quantity: " + quantity[0]);

	// NEW CHART

	var trace1 = {
	  	x: blocks,
		y: prices,
		name: 'Price data',
		type: 'scatter'
	};

	var trace2 = {
		x: blocks,
		y: quantity,
		name: 'Quantity data',
		yaxis: 'y2',
		type: 'scatter'
	};

	var data = [trace1, trace2];

	var layout = {
	  title: 'Clearing Price && Quantity',
	  yaxis: {title: 'Price'},
	  yaxis2: {
	    title: 'Quantity',
	    titlefont: {color: 'rgb(148, 103, 189)'},
	    tickfont: {color: 'rgb(148, 103, 189)'},
	    overlaying: 'y',
	    side: 'right'
	  }
	};

	Plotly.plot('price_chart', data, layout);

});
