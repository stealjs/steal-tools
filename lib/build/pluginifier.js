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
	_.assign(pluginifierOptions, {
		useNormalizedDependencies: true
	});
	var exports = pluginifierOptions.exports || {};

	// Setup logging
	logging.setup(pluginifierOptions);

	return makeGraph(config, pluginifierOptions).then(function(data){

		var pluginify = function(moduleName, options){
			options = _.extend({
				ignore: [],
				minify: true,
				removeDevelopmentCode: true,
				format: "global"
			},pluginifierOptions, options);
			
			if(!moduleName) {
				moduleName = data.loader.main;
			}

			// get nodes
			var nodes = makeBundleFromModuleName(data.graph, moduleName);

			var ignores = pluginifier.getAllIgnores(options.ignore, data.graph);
			var nodesInBundle = pluginifier.notIgnored(nodes, ignores);
			
			// Minify would make sense to do first as it is expensive.  But it
			// might make everything else hard to debug
			
			// transpile
			transpile(nodesInBundle, options.format === "global" ? "amd" : options.format, options);
			
			// clean
			if(options.removeDevelopmentCode) {
				clean(nodesInBundle, options);	
			}
			// possibly minify
			if(options.minify) {
				minify(nodesInBundle);
			}
			
			var bundle = {nodes: nodesInBundle};
			// possibly transpile
			if(options.format === "global") {
				addGlobalShim(bundle, options);
			}
			if(hasES6(nodesInBundle)){
				addTraceurRuntime(bundle);
			}
			
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
