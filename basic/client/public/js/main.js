// add scripts

$(document).on('ready', function() {
	console.log('sanity check!');

	TESTER = document.getElementById('tester');
	var data = TESTER.getAttribute('data-for');
	// console.log("TEST: " + JSON.stringify(data));

	var blocks = [];
	var prices = [];
	var quantity = [];

	for (var i = 0; i < data.length; i=i+4) {
		blocks.push(data[i]);
		prices.push(data[i+1]);
		quantity.push(data[i+2]);
	}

	// data.forEach(res => {
	// 	blocks.push(res[0]);
	// });

	// data.forEach(res => {
	// 	prices.push(res[1]);
	// });

	// data.forEach(res => {
	// 	quantity.push(res[2]);
	// });

	console.log("Blocks: " + blocks[0]);
	console.log("Prices: " + prices[0]);
	console.log("Quantity: " + quantity[0]);
	
	Plotly.plot( TESTER, [{
	x: [1, 2, 3, 4, 5],
	y: [1, 2, 4, 8, 16] }], {
	margin: { t: 0 } } );

});
