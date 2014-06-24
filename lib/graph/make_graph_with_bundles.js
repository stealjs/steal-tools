var dependencyGraph = require("./make_graph");
var winston = require('winston');

function addBundleOnEveryModule (graph, bundle){
	for(var name in graph) {
		addBundle( graph[name],bundle );
	}
}

function addBundle (node, bundle) {
	if(!node.bundles) {
		node.bundles = [bundle];
	} else if(node.bundles.indexOf(bundle) == -1) {
		node.bundles.push(bundle);
	}
}

// merges everything in `newGraph` into `masterGraph` and make sure it lists
// `bundle` as one of its bundles.
function mergeIntoMasterAndAddBundle (masterGraph, newGraph, bundle) {
	for(var name in newGraph) {
    winston.debug('> ' + name);
		if(!masterGraph[name]) {
			masterGraph[name] = newGraph[name];
		}
		addBundle(masterGraph[name], bundle);
	}
}

module.exports = function(config){
	
	var configPath = config.config;
	
	// Get the first dependency graph
	return dependencyGraph(config).then(function(data){
		
		var masterGraph = data.graph,
			main = data.steal.config("startId");
		
		// add the "main" bundle to everything currently on the main dependency graph;
		addBundleOnEveryModule(masterGraph, main); 
		
		// Get the bundles of the loader
		var bundleNames = data.steal.config("bundle") || [];

		// Get the next bundle name and gets a graph for it.
		// Merges those nodes into the masterGraph
		var getNextGraphAndMerge = function(){
			var nextBundle = bundleNames.shift();

			if(!nextBundle) {
				// If there are no more bundles, return data
				return {
					graph: masterGraph,
					steal: data.steal,
					loader: data.loader
				};
			} else {
        winston.debug('OPENING: ' + nextBundle);

				return dependencyGraph({
					config: configPath,
					startId: nextBundle
				}).then(function(data){
					
					mergeIntoMasterAndAddBundle(masterGraph, data.graph, nextBundle);
					return getNextGraphAndMerge();
				});
			}
		};
		
		return getNextGraphAndMerge();
		
	});
};
