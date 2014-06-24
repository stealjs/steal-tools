var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
};
var bundleCounter = 0;

function getName(bundle) {
	var usedBundleNames = {};
	var dirName = "bundles/";

	var bundleNames = bundle.bundles.map(function(appName){
		return (appName+"").replace(".js","");
	});

	// try with just the last part
	var shortened = bundleNames.map(function(l){
		return filename(l);
	}).join('-');

	var buildType = bundle.buildType || "js",
		buildTypeSuffix = buildType === "js" ? "" : "."+buildType+"!";

	if(!usedBundleNames[shortened]){
		usedBundleNames[shortened] = true;
		return dirName+shortened+buildTypeSuffix;
	} else if(shortened.length > 50){
		return dirName+shortened.substr(0,50)+"-"+bundleNames.length+"-"+(bundleCounter++)+buildTypeSuffix;
	} else {
		return dirName+shortened+buildTypeSuffix;
	}
}

module.exports = function(bundle) {
	bundle.name = getName(bundle);
};

module.exports.getName = getName;
