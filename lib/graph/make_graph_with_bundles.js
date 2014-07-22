var dependencyGraph = require("./make_graph");
var winston = require('winston'),
	_ = require("lodash");

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
	
	// the names of everything we are going to load
	var bundleNames = [];
	
	var cfg = _.clone(config, true);
	if(cfg.main instanceof Array) {
		bundleNames = cfg.main;
		cfg.main = bundleNames.shift();
	}
	
	// Get the first dependency graph
	return dependencyGraph(cfg).then(function(data){
		
		var masterGraph = data.graph,
			main = data.steal.System.main;
		
		// add the "main" bundle to everything currently on the main dependency graph;
		addBundleOnEveryModule(masterGraph, main); 
		
		// Get the bundles of the loader
		bundleNames = bundleNames.concat( ( data.steal.System.bundle || [] ).slice(0) );

		// Get the next bundle name and gets a graph for it.
		// Merges those nodes into the masterGraph
		var getNextGraphAndMerge = function(){
			var nextBundle = bundleNames.shift();

			if(!nextBundle) {
				// If there are no more bundles, return data
				return {
					graph: masterGraph,
					steal: data.steal,
					loader: data.loader,
					buildLoader: data.buildLoader
				};
			} else {
				winston.debug('OPENING: ' + nextBundle);
				var copy = _.clone(cfg, true);
				copy.main = nextBundle;
				return dependencyGraph(copy).then(function(data){
					mergeIntoMasterAndAddBundle(masterGraph, data.graph, nextBundle);
					return getNextGraphAndMerge();
				});
			}
		};
		
		return getNextGraphAndMerge();
		
	});
};
