steal(function(){
	// Test: See if 'dep_all.js' is on the page
	console.log("running")
	if (window.location.hash == '#a') {
		steal('app_a.js', function(){
			console.log("holler back yall")
			// alert('Package A was stolen.')

			// Test: See if 'app_a.js' is on the page
			// Test: See if 'dep_a_b.js' is on the page

		});
	}
	
});
