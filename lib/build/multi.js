var makeBundleGraph = require("../graph/make_graph_with_bundles"),
	order = require("../graph/order"),
	transpile = require("../graph/transpile"),
	minifyGraph = require("../graph/minify"),
	pluck = require("../graph/pluck"),
	makeBundle = require("../bundle/make_bundle"),
	nameBundle = require("../bundle/name"),
	flattenBundle = require("../bundle/flatten"),
	writeBundles = require("../bundle/write_bundles"),
	makeBundlesConfig = require("../bundle/make_bundles_config");


module.exports = function(config){
	// Get the merged dependency graphs with each node containing
	// a list of bundles like:
	//  
	//     {
	//	     "moduleName": {bundles: ["bundleName", ...], load: }
	//     }
	return makeBundleGraph(config).then(function(data){
		
		var dependencyGraph = data.graph,
			baseURL = data.loader.baseURL,
			main = data.steal.config("startId");
		
		// remove stealconfig and stealdev
		var stealconfig = pluck(dependencyGraph,"stealconfig");
		var stealdev = pluck(dependencyGraph,"steal/dev/dev");
		
		// order the modules
		data.steal.config("bundle").forEach(function(moduleName){
			order(dependencyGraph, moduleName);
		});
		
		// transpile each module to amd
		transpile(dependencyGraph, "amd");
		
		// minify every file in the graph
		minifyGraph(dependencyGraph);
		
		// pull out the main module and its dependencies
		var stealConfigAndMain = stealconfig.concat( pluck(dependencyGraph, main) );
		
		// create a master bundle with that all minified
		var masterBundle =  {
			nodes: minifyGraph( stealConfigAndMain ),
			bundles: [main]
		};
		nameBundle(masterBundle,{});
		
		
		// Put everything into unique bundles
		var bundles = makeBundle(dependencyGraph),
			bundleNames = {};
		
		// Merge bundles so no one endpoint has to load more than X bundles
		flattenBundle(bundles,5);
		
		// name each bundle
		bundles.forEach(nameBundle);
		
		// Add the master to bundles so it will be written out
		bundles.unshift(masterBundle);
		
		// make config so System knows where to look for bundles
		var configNode = makeBundlesConfig(bundles);
		
		// add that config to the masterBundle
		masterBundle.nodes.unshift(configNode);

		// write bundles to the file system
		writeBundles(bundles, baseURL);
	});
};
