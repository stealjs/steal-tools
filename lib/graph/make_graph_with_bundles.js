var dependencyGraph = require("./make_graph");
var _ = require("lodash");
var normalizeBundle = require("../loader/normalize_bundle");
var through = require("through2");
var fs = require("fs-extra");

var slice = Array.prototype.slice;

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
		if(!masterGraph[name]) {
			masterGraph[name] = newGraph[name];
		}
		// If it's a plugin we'll use the new node but need to copy any previous
		// bundles onto the new node
		else if(masterGraph[name] && masterGraph[name].isPlugin) {
			var oldBundle = masterGraph[name].bundles || [];
			masterGraph[name] = newGraph[name];
			oldBundle.forEach(function(bundle){
				addBundle(masterGraph[name], bundle);
			});
		}
		addBundle(masterGraph[name], bundle);
	}
}

// Create temporary files for virtual modules.
function createModuleConfig(loader) {
	var tmp = require("tmp");
	var config = {};
	var virtualModules = loader.virtualModules || {};
	for(var moduleName in virtualModules) {
		var filename = tmp.fileSync().name;
		var source = virtualModules[moduleName];
		fs.writeFileSync(filename, source, "utf8");

		var paths = config.paths = config.paths || {};
		paths[moduleName] = "file:"+filename;
	}
	return config;
}

var makeBundleGraph = module.exports = function(config, options){
	options = options || {};

	// the names of everything we are going to load
	var bundleNames = [];

	var cfg = _.clone(config, true);
	if( Array.isArray(cfg.main) ) {
		bundleNames = slice.call(cfg.main);
		cfg.main = bundleNames.shift();
	}
	// Get the first dependency graph
	return dependencyGraph(cfg, options)
		.then(normalizeBundle)
		.then(function(data){

		// TODO I left off here, need to make sure main is normalized.

		var masterGraph = data.graph,
			main = data.steal.System.main;

		// add the "main" bundle to everything currently on the main dependency graph;
		addBundleOnEveryModule(masterGraph, main);

		// Get the bundles of the loader
		var loader = data.steal.System;
		bundleNames = bundleNames.concat(loader.bundle.slice(0));

		// Get config for virtual modules
		options.system = createModuleConfig(loader);

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
					buildLoader: data.buildLoader,
					mains: data.mains
				};
			} else {
				var copy = _.clone(cfg, true);
				copy.main = nextBundle;
				return dependencyGraph(copy, options).then(function(data){
					mergeIntoMasterAndAddBundle(masterGraph, data.graph, nextBundle);
					return getNextGraphAndMerge();
				});
			}
		};

		return getNextGraphAndMerge();

	});
};

// A Stream version of makeBundleGraph
makeBundleGraph.createBundleGraphStream = function(){
	var args = arguments;
	return through.obj(function(moduleName, enc, done){
		return makeBundleGraph.apply(null, args).then(function(data){
			done(null, data);
		}, done);
	});
};
