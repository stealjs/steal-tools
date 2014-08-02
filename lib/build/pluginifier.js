var makeGraph = require("../graph/make_graph"),
	makeBundleFromModuleName = require("../graph/get"),
	concatSource = require("../bundle/concat_source"),
	mapDependencies = require("../graph/map_dependencies"),
	
	logging = require('../logger'),
	hasES6 = require('../graph/has_es6'),
	path = require('path'),
	fs = require('fs'),
	_ = require('lodash'),
	hasES6 = require("../graph/has_es6"),
	addTraceurRuntime = require("../bundle/add_traceur_runtime"),
	addGlobalShim = require("../bundle/add_global_shim"),
	transpile = require('../graph/transpile'),
	clean = require("../graph/clean"),
	minify = require("../graph/minify");

var toss = function(e){
	setTimeout(function(){
		throw e;
	},1);
};



var pluginifier = function(config, pluginifierOptions){
	pluginifierOptions = _.assign(pluginifierOptions||{}, {
		useNormalizedDependencies: true
	});
	var exports = pluginifierOptions.exports || {};

	// Setup logging
	logging.setup(pluginifierOptions);

	return makeGraph(config, pluginifierOptions).then(function(data){

		var pluginify = function(moduleNames, options){
			options = _.extend({
				ignore: [],
				minify: true,
				removeDevelopmentCode: true,
				format: "global",
				includeTraceurRuntime: true,
				ignoreAllDependencies: false
			},pluginifierOptions, options);
			
			if(!moduleNames) {
				moduleNames = data.loader.main;
			}
			if(typeof moduleNames === "string"){
				moduleNames = [moduleNames];
			}
			
			moduleNames.forEach(function(moduleName){
				if(!data.graph[moduleName]){
					throw "Can't find module '"+moduleName+"' in graph.";
				}
			});
			
			// get nodes
			if(options.ignoreAllDependencies) {
				
				var nodesInBundle = moduleNames.map(function(moduleName){
					return data.graph[moduleName];
				});
					
			} else {
				// get all nodes that are dependencies of moduleName
				var nodes = makeBundleFromModuleName(data.graph, moduleNames);
				// figure ot what modules should be ignored
				var ignores = pluginifier.getAllIgnores(options.ignore, data.graph);
				// get only the nodes that should be in the bundle.
				var nodesInBundle = pluginifier.notIgnored(nodes, ignores);
			}
			
			
			// Minify would make sense to do first as it is expensive.  But it
			// might make everything else hard to debug
			
			// transpile
			transpile(nodesInBundle, options.format === "global" ? "amd" : options.format, options);
			
			// clean
			if(options.removeDevelopmentCode) {
				clean(nodesInBundle, options);	
			}
			// minify
			if(options.minify) {
				minify(nodesInBundle);
			}
			
			var bundle = {nodes: nodesInBundle};
			
			// add shim if global
			if(options.format === "global") {
				addGlobalShim(bundle, options);
			}
			if(hasES6(nodesInBundle) && options.includeTraceurRuntime){
				addTraceurRuntime(bundle);
			}
			winston.debug('output modules:');
			bundle.nodes.forEach(function(node) {
				winston.info("+ %s", node.load.name);
			});
			concatSource(bundle,"activeSource");
			
			return bundle.source;
		};

		// Set the graph on pluginify in case anyone needs to use it.
		pluginify.graph = data.graph;

		return pluginify;
		
		
	}).catch(function(e){
		toss(e);
	});
	
};



var matches = function(rules, name){
	if(rules === name) {
		return true;
	}else if( Array.isArray(rules) ) {
		for(var i =0; i < rules.length; i++) {
			if( matches(rules[i], name) ) {
				return true;
			}
		}
	} else if( rules instanceof RegExp) {
		return rules.test(name);
	}
	
};

pluginifier.getAllIgnores = function(baseIgnores, graph) {
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

pluginifier.notIgnored = function( bundle, rules ) {
	var notIgnored = [];
	bundle.forEach(function(node){
		if( !matches(rules, node.load.name) ) {
			notIgnored.push(node);
		}
	});
	return notIgnored;
};


module.exports = pluginifier;
