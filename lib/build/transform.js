var makeGraph = require("../graph/make_graph"),
	makeBundleFromModuleName = require("../graph/get"),
	concatSource = require("../bundle/concat_source"),
	mapDependencies = require("../graph/map_dependencies"),
	
	logging = require('../logger'),
	hasES6 = require('../graph/has_es6'),
	_ = require('lodash'),
	hasES6 = require("../graph/has_es6"),
	addTraceurRuntime = require("../bundle/add_traceur_runtime"),
	addGlobalShim = require("../bundle/add_global_shim"),
	transpile = require('../graph/transpile'),
	clean = require("../graph/clean"),
	minify = require("../graph/minify"),
	winston = require('winston'),
	removeActiveSourceKeys = require("../graph/remove_active_source_keys");
	
var toss = function(e){
	setTimeout(function(){
		throw e;
	},1);
};

var transformImport = function(config, transformOptions){
	transformOptions = _.assign(transformOptions||{}, {
		useNormalizedDependencies: true
	});
	transformOptions.exports = transformOptions.exports || {};

	// Setup logging
	logging.setup(transformOptions, config);

	return makeGraph(config, transformOptions).then(function(data){

		var transform = function(moduleNames, options){
			options = _.extend({
				ignore: [],
				minify: false,
				removeDevelopmentCode: true,
				format: "global",
				includeTraceurRuntime: true,
				ignoreAllDependencies: false
			},transformOptions, options);
			
			if(!moduleNames) {
				moduleNames = data.loader.main;
			}
			if(typeof moduleNames === "string"){
				moduleNames = [moduleNames];
			}
			
			moduleNames.forEach(function(moduleName){
				if(!data.graph[moduleName]){
					throw new Error("Can't find module '" + moduleName + "' in graph.");
				}
			});
			var nodesInBundle;
			
			// get nodes
			if(options.ignoreAllDependencies) {
				
				nodesInBundle = moduleNames.map(function(moduleName){
					return data.graph[moduleName];
				});
					
			} else {
				// get all nodes that are dependencies of moduleName
				var nodes = makeBundleFromModuleName(data.graph, moduleNames);
				// figure ot what modules should be ignored
				var ignores = transformImport.getAllIgnores(options.ignore, data.graph);
				// get only the nodes that should be in the bundle.
				nodesInBundle = transformImport.notIgnored(nodes, ignores);
			}
			
			// resets the active source to be worked from.
			removeActiveSourceKeys(nodesInBundle, options);

			// #### clean
			// Clean first 
			if(options.removeDevelopmentCode) {
				winston.debug('Cleaning...');
				clean(nodesInBundle, options);	
			}
			// Minify would make sense to do next as it is expensive.  But it
			// makes transpile hard to debug.
			
			// #### transpile
			winston.debug('Transpiling...');
			transpile(nodesInBundle, 
				options.format === "global" ? "amd" : options.format, 
				options.format === "global" ? _.assign(_.clone(options),{namedDefines: true})  : options, 
				data);
			
			
			// #### minify
			if(options.minify) {
				winston.debug('Minifying...');
				minify(nodesInBundle);
			}
			
			var bundle = {nodes: nodesInBundle};
			
			// add shim if global
			// TODO: document noGlobalShim
			if(options.format === "global" && !options.noGlobalShim) {
				addGlobalShim(bundle, options);
			}
			if(hasES6(nodesInBundle) && options.includeTraceurRuntime){
				addTraceurRuntime(bundle);
			}
			winston.debug('Output Modules:');
			bundle.nodes.forEach(function(node) {
				winston.debug("+ %s", node.load.name);
			});
			concatSource(bundle,"activeSource", options.format === "global");
			
			return bundle.source;
		};

		// Set the graph on transform in case anyone needs to use it.
		transform.graph = data.graph;
		transform.loader = data.loader;
		return transform;
		
		
	}).catch(function(e){
		toss(e);
	});
	
};



var matches = function(rules, name, load){
	if(rules === name) {
		return true;
	}else if( Array.isArray(rules) ) {
		for(var i =0; i < rules.length; i++) {
			if( matches(rules[i], name, load) ) {
				return true;
			}
		}
	} else if( rules instanceof RegExp) {
		return rules.test(name);
	} else if( typeof rules === "function") {
		return rules(name, load);
	}
	
};

transformImport.getAllIgnores = function(baseIgnores, graph) {
	var ignores = [];
	baseIgnores = Array.isArray(baseIgnores) ? baseIgnores : [ baseIgnores ];

	baseIgnores.forEach(function(moduleName){

		// An ignore could be a regular expression, this only applies to strings.
		if(typeof moduleName === "string") {
			// Add this ignore's dependencies
			ignores = ignores.concat(mapDependencies(graph, moduleName, function(name){
				return name;
			}));
		} else {
			ignores.push(moduleName);
		}

	});

	return ignores;
};

transformImport.notIgnored = function( bundle, rules ) {
	var notIgnored = [];
	bundle.forEach(function(node){
		if( !matches(rules, node.load.name, node.load ) ) {
			notIgnored.push(node);
		}
	});
	return notIgnored;
};

transformImport.matches = matches;


module.exports = transformImport;
