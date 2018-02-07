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
	
	// Add Clearing Prices on Chart - Blue Line
	Plotly.plot( price_chart, [{
		name: 'Price',
		x: blocks,
		y: prices }], 
		{
			title: 'Clearing Price && Quantity',
			font: {
				size: 18,
			}
		}
	);

	// Add Clearing Quantities on Chart - Orange Line
	Plotly.plot( price_chart, [{
		name: 'Quantity',
		x: blocks,
		y: quantity }]
	);

});
