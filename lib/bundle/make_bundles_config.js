var directory = require("./dist_dir");
var util = require("util");

module.exports = function(bundles, options){
	var paths = getBundlesPaths(options);
	
	var bundledBundles = bundles.slice(0);
	if(options.bundleSteal){
		bundledBundles.shift();
	}
	
	var bundlesConfig = {};
	bundledBundles.forEach(function(bundle){
		bundlesConfig[bundle.name] = bundle.nodes.map(function(node){
			return node.load.name;
		});
	});
	
	return {
		load: {name: "[system-bundles-config]"},
		minifiedSource: paths + "System.bundles = "+JSON.stringify(bundlesConfig)+";"
	};
};

// Get the System.paths needed to map bundles, if a different distDir is provided.
function getBundlesPaths(options){
	// If a distDir is not provided, the paths are not needed because they are
	// already set up in steal.js
	if(!options.distDir) {
		return "";
	}

	// Get the dist directory and set the paths output
	var dist = directory.name(options.distDir);
	var paths = util.format('System.paths["bundles/*.css"] ="%s/bundles/*css";\n' +
													'System.paths["bundles/*"] = "%s/bundles/*.js";\n',
													dist, dist);

	return paths;
}
