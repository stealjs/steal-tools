var transpile = require('transpile');
var nodeDependencyMap = require("../node/dependency_map"),
	minify = require("../buildTypes/minifyJS"),
	transformActiveSource = require("../node/transform_active_source"),
	_ = require("lodash");


var transpileNode = function(node, outputFormat, options){
	if( !node.load.metadata.buildType || node.load.metadata.buildType === "js"  ) {
		
		transformActiveSource(node,"format-"+outputFormat,function(node, source){
			if(options.useNormalizedDependencies) {
				options.normalizeMap = nodeDependencyMap(node);
			}
			// make sure load has activeSource
			var load = _.clone(node.load, true);
			load.source = source || load.source;
			// Minify globals prior to transpiling because they can't
			// be minified after they become a System.define.
			if(load.metadata.format === "global" && options.minify) {
				load.source = minify(load.source);
			}
			return transpile.to(load, outputFormat, options);
		});
	}
};

module.exports = function(graph, outputFormat, options){
	
	options = options || {};
	if(Array.isArray(graph)) {
		graph.forEach(function(node){
			transpileNode(node, outputFormat, options);
		});
	} else {
		for(var name in graph) {
			var node = graph[name];
			// If JavaScript
			transpileNode(node, outputFormat, options);
		}
	}
};
