steal('basics/module', './other.js', function(module, other){
	
	window.RESULT = {
		name: "pluginified",
		module: module,
		other: other
	};

	
});
