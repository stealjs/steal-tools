
var path = require("path");


var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
};
var bundleCounter = 0;


module.exports = function(bundle, usedBundleNames){
	
	var bundleNames = bundle.bundles.map(function(appName){
		return (appName+"").replace(".js","").replace()
	});

	// try with just the last part
	var shortened = bundleNames.map(function(l){
		return filename(l);
	}).join('-');
	
	if(!usedBundleNames[shortened]){
		usedBundleNames[shortened] = true;
		bundle.name = shortened;
	} else if(expanded.length > 50){
		bundle.name = shortened.substr(0,50)+"-"+bundleNames.length+"-"+(bundleCounter++);
	} else {
		bundle.name = expanded;
	}
};

