var crypto = require('crypto');

var npmNameExp = /.+@.+#.+/;
function isNpm(name) {
	return npmNameExp.test(name);
}

function deNpm(name) {
	if(!isNpm(name)) return name;
	var modulePath = name.substr(name.indexOf("#")+1);
	return modulePath;
}

var filename = function(uri){
		var lastSlash = uri.lastIndexOf("/"),
			matches = ( lastSlash == -1 ? uri : uri.substr(lastSlash+1) ).match(/^[\w-\s\.]+/);
		return matches ? matches[0] : "";
	},
	pluginPart = function(name){
		var bang = name.lastIndexOf("!");
		if(bang !== -1) {
			return name.substr(bang+1);
		}
	},
	pluginResource = function(name){
		var bang = name.lastIndexOf("!");
		if(bang !== -1) {
			return name.substr(0, bang);
		}
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

		var plugin = pluginPart(shortened);
		if(plugin) {
			shortened = pluginResource(shortened);
			// This is a project using directories.lib
			// and needs to be packageName/modulePath
			if(isNpm(shortened)) {
				var pkgName = shortened.substr(0, shortened.indexOf("@"));
				shortened = pkgName + "/" + deNpm(shortened);
			}
			shortened = shortened.substr(0, shortened.indexOf("."));
		}
	}

	var buildType = bundle.buildType || "js",
		buildTypeSuffix = buildType === "js" ? "" : "."+buildType+"!";

	if(!usedBundleNames[shortened]){
		usedBundleNames[shortened] = true;
		return dirName+deNpm(shortened+buildTypeSuffix);
	} else if(shortened.length > 50){
		return dirName+shortened.substr(0,50)+"-"+bundleNames.length+"-"+(bundleCounter++)+buildTypeSuffix;
	} else {
		return dirName+shortened+buildTypeSuffix;
	}
}

exports = module.exports = function(bundle) {
	bundle.name = getName(bundle);
};

exports.getName = getName;
