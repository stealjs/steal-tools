
var path = require("path");


var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
};
var bundleCounter = 0;


module.exports = function(bundle, usedBundleNames){
	
	var bundleNames = bundle.bundles.map(function(appName){
		return (appName+"").replace(".js","")
	});

	// try with just the last part
	var shortened = bundleNames.map(function(l){
		return filename(l);
	}).join('-');
	
	var buildType = bundle.buildType || "js",
		buildTypeSuffix = buildType === "js" ? "" : "."+buildType+"!";
	
	if(!usedBundleNames[shortened]){
		usedBundleNames[shortened] = true;
		bundle.name = "bundles/"+shortened+buildTypeSuffix;
	} else if(expanded.length > 50){
		bundle.name = "bundles/"+shortened.substr(0,50)+"-"+bundleNames.length+"-"+(bundleCounter++)+buildTypeSuffix;
	} else {
		bundle.name = "bundles/"+expanded+buildTypeSuffix;
	}
};

