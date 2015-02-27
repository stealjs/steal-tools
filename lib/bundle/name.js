var crypto = require('crypto');

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

	var shortened = bundleNames.map(function(l){
		return filename(l);
	}).join('-');

	if (bundle.bundles.length > 1 && shortened.length > 25) {
		var hasher = crypto.createHash("md5");
		hasher.update(shortened);
		var shortenedHash = hasher.digest('hex');
		shortened = shortened.substr(0, 16) + "-" + shortenedHash.substr(0, 8);
	}

	// If this is a "main" bundle
	if (bundle.bundles.length === 1 ) {
		// Use the full path name, removing trailing ".js"
		shortened = bundle.bundles[0].replace(".js", "");
	}

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

function denpmed(bundle) {
	var name = getName(bundle);
	if(/.+@.+#.+/.test(name)) {
		bundle.name = name.substr(name.lastIndexOf("#") + 1);
	}
	return bundle.name;
}

exports = module.exports = function(bundle) {
	bundle.name = getName(bundle);
};

exports.getName = getName;
exports.denpmed = denpmed;
